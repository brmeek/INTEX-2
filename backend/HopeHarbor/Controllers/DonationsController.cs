using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonationsController : ControllerBase
{
    public sealed class DonorSummaryResponse
    {
        public int Year { get; set; }
        public decimal DonorTotalThisYear { get; set; }
        public decimal OrganizationTotalThisYear { get; set; }
        public decimal LifetimeTotal { get; set; }
        public int DonationCountThisYear { get; set; }
    }

    public sealed class DonorDonationRequest
    {
        [Required]
        [Range(1, 1_000_000)]
        public decimal Amount { get; set; }

        public bool IsRecurring { get; set; }
    }

    private readonly HopeHarborContext _db;
    public DonationsController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? type, [FromQuery] string? campaign,
        [FromQuery] int? supporterId, [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var q = _db.Donations.Include(d => d.Supporter).AsQueryable();
        if (!string.IsNullOrEmpty(type)) q = q.Where(d => d.DonationType == type);
        if (!string.IsNullOrEmpty(campaign)) q = q.Where(d => d.CampaignName == campaign);
        if (supporterId.HasValue) q = q.Where(d => d.SupporterId == supporterId);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(d => d.DonationDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Donations.Include(d => d.Supporter).Include(d => d.Allocations).Include(d => d.InKindItems).FirstOrDefaultAsync(d => d.DonationId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpGet("self-serve/summary")]
    [Authorize(Roles = "Donor,Admin")]
    public async Task<IActionResult> GetSelfServeSummary()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Could not determine authenticated donor email." });

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter is null)
        {
            return Ok(new DonorSummaryResponse
            {
                Year = DateTime.UtcNow.Year,
                DonorTotalThisYear = 0m,
                OrganizationTotalThisYear = 0m,
                LifetimeTotal = 0m,
                DonationCountThisYear = 0
            });
        }

        var currentYear = DateTime.UtcNow.Year;
        var donations = _db.Donations.Where(d => d.SupporterId == supporter.SupporterId);

        var donorTotalThisYear = await donations
            .Where(d => d.DonationDate.HasValue && d.DonationDate.Value.Year == currentYear)
            .SumAsync(d => d.Amount ?? 0m);

        var donationCountThisYear = await donations
            .CountAsync(d => d.DonationDate.HasValue && d.DonationDate.Value.Year == currentYear);

        var lifetimeTotal = await donations.SumAsync(d => d.Amount ?? 0m);
        var organizationTotalThisYear = await _db.Donations
            .Where(d => d.DonationDate.HasValue && d.DonationDate.Value.Year == currentYear)
            .SumAsync(d => d.Amount ?? 0m);

        return Ok(new DonorSummaryResponse
        {
            Year = currentYear,
            DonorTotalThisYear = donorTotalThisYear,
            OrganizationTotalThisYear = organizationTotalThisYear,
            LifetimeTotal = lifetimeTotal,
            DonationCountThisYear = donationCountThisYear
        });
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = donation.DonationId }, donation);
    }

    [HttpPost("self-serve")]
    [Authorize(Roles = "Donor,Admin")]
    public async Task<IActionResult> CreateSelfServe([FromBody] DonorDonationRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Could not determine authenticated donor email." });

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.Email == email);
        if (supporter is null)
        {
            supporter = new Supporter
            {
                SupporterName = email.Split('@')[0],
                SupporterType = "Monetary",
                Email = email,
                Status = "Active",
                FirstGiftDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
                LastGiftDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
                TotalGiven = request.Amount
            };
            _db.Supporters.Add(supporter);
            await _db.SaveChangesAsync();
        }
        else
        {
            supporter.LastGiftDate = DateOnly.FromDateTime(DateTime.UtcNow.Date);
            supporter.TotalGiven = (supporter.TotalGiven ?? 0m) + request.Amount;
        }

        var donation = new Donation
        {
            SupporterId = supporter.SupporterId,
            DonationType = "Monetary",
            DonationDate = DateOnly.FromDateTime(DateTime.UtcNow.Date),
            IsRecurring = request.IsRecurring,
            CampaignName = "Donor Portal",
            ChannelSource = "Donor Portal",
            CurrencyCode = "USD",
            Amount = request.Amount,
            EstimatedValue = request.Amount,
            Notes = $"Donor self-serve gift from {email}"
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Donation donation)
    {
        var existing = await _db.Donations.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(donation);
        existing.DonationId = id;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Donations.FindAsync(id);
        if (item == null) return NotFound();
        _db.Donations.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
