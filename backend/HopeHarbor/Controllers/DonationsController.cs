using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;
using HopeHarbor.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonationsController : ControllerBase
{
    public sealed class DonorImpactForecastRequest
    {
        [Range(1, 1_000_000)]
        public decimal Amount { get; set; }

        public bool IsRecurring { get; set; }
        public string? ChannelSource { get; set; }
        public string? CampaignName { get; set; }
        public string? CurrencyCode { get; set; }
    }

    public sealed class InKindValueEstimateRequest
    {
        [Required]
        public string ItemCategory { get; set; } = "Supplies";

        [Range(1, 100000)]
        public int Quantity { get; set; } = 1;

        public string UnitOfMeasure { get; set; } = "pcs";
        public string IntendedUse { get; set; } = "Education";
        public string ReceivedCondition { get; set; } = "Good";
    }

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

    public sealed class DonorRecentDonationResponse
    {
        public int DonationId { get; set; }
        public string DonationType { get; set; } = string.Empty;
        public DateOnly? DonationDate { get; set; }
        public decimal Amount { get; set; }
        public bool IsRecurring { get; set; }
        public string ChannelSource { get; set; } = string.Empty;
        public string CampaignName { get; set; } = string.Empty;
    }

    private readonly HopeHarborContext _db;
    private readonly IInKindDonationValuationService _inKindDonationValuationService;
    private readonly IDonorImpactForecastingService _donorImpactForecastingService;

    public DonationsController(
        HopeHarborContext db,
        IInKindDonationValuationService inKindDonationValuationService,
        IDonorImpactForecastingService donorImpactForecastingService)
    {
        _db = db;
        _inKindDonationValuationService = inKindDonationValuationService;
        _donorImpactForecastingService = donorImpactForecastingService;
    }

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
    [Authorize(Roles = AuthRoles.Donor + "," + AuthRoles.Admin)]
    public async Task<IActionResult> GetSelfServeSummary()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Could not determine authenticated donor email." });

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var supporterIds = await _db.Supporters
            .Where(s => s.Email != null && s.Email.ToLower() == normalizedEmail)
            .Select(s => s.SupporterId)
            .ToListAsync();

        if (supporterIds.Count == 0)
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
        var donations = _db.Donations.Where(d => d.SupporterId != null && supporterIds.Contains(d.SupporterId.Value));

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

    [HttpGet("self-serve/recent")]
    [Authorize(Roles = AuthRoles.Donor + "," + AuthRoles.Admin)]
    public async Task<IActionResult> GetSelfServeRecentDonations([FromQuery] int take = 10)
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name;
        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Could not determine authenticated donor email." });

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var supporterIds = await _db.Supporters
            .Where(s => s.Email != null && s.Email.ToLower() == normalizedEmail)
            .Select(s => s.SupporterId)
            .ToListAsync();

        if (supporterIds.Count == 0)
            return Ok(Array.Empty<DonorRecentDonationResponse>());

        take = Math.Clamp(take, 1, 50);
        var donations = await _db.Donations
            .Where(d => d.SupporterId != null && supporterIds.Contains(d.SupporterId.Value))
            .OrderByDescending(d => d.DonationDate)
            .ThenByDescending(d => d.DonationId)
            .Take(take)
            .Select(d => new DonorRecentDonationResponse
            {
                DonationId = d.DonationId,
                DonationType = d.DonationType ?? "Monetary",
                DonationDate = d.DonationDate,
                Amount = d.Amount ?? d.EstimatedValue ?? 0m,
                IsRecurring = d.IsRecurring ?? false,
                ChannelSource = d.ChannelSource ?? "Donor Portal",
                CampaignName = d.CampaignName ?? "Donor Portal"
            })
            .ToListAsync();

        return Ok(donations);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = donation.DonationId }, donation);
    }

    [HttpPost("in-kind/estimate")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public IActionResult EstimateInKindValue([FromBody] InKindValueEstimateRequest request)
    {
        var estimate = _inKindDonationValuationService.Estimate(new InKindDonationValueInput
        {
            ItemCategory = request.ItemCategory,
            Quantity = request.Quantity,
            UnitOfMeasure = request.UnitOfMeasure,
            IntendedUse = request.IntendedUse,
            ReceivedCondition = request.ReceivedCondition
        });

        return Ok(new
        {
            estimatedUnitValuePhp = estimate.EstimatedUnitValuePhp,
            estimatedTotalValuePhp = estimate.EstimatedTotalValuePhp,
            modelVersion = estimate.ModelVersion
        });
    }

    [HttpPost("self-serve")]
    [Authorize(Roles = AuthRoles.Donor + "," + AuthRoles.Admin)]
    public async Task<IActionResult> CreateSelfServe([FromBody] DonorDonationRequest request, CancellationToken cancellationToken)
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Could not determine authenticated donor email." });

        var nowUtc = DateTime.UtcNow;
        var today = DateOnly.FromDateTime(nowUtc.Date);
        var normalizedEmail = email.Trim();
        var normalizedEmailLower = normalizedEmail.ToLowerInvariant();
        await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

        var supporter = await _db.Supporters
            .Where(s => s.Email != null && s.Email.ToLower() == normalizedEmailLower)
            .OrderBy(s => s.SupporterId)
            .FirstOrDefaultAsync(cancellationToken);

        if (supporter is null)
        {
            supporter = new Supporter
            {
                SupporterId = await GetNextSupporterIdAsync(cancellationToken),
                SupporterName = normalizedEmail.Split('@')[0],
                SupporterType = "Individual",
                Email = normalizedEmail,
                Status = "Active",
                FirstGiftDate = today,
                CreatedAt = nowUtc,
                AcquisitionChannel = "Donor Portal"
            };
            _db.Supporters.Add(supporter);
        }
        else
        {
            if (supporter.FirstGiftDate == null)
                supporter.FirstGiftDate = today;

            if (string.IsNullOrWhiteSpace(supporter.SupporterName))
                supporter.SupporterName = normalizedEmail.Split('@')[0];

            if (string.IsNullOrWhiteSpace(supporter.AcquisitionChannel))
                supporter.AcquisitionChannel = "Donor Portal";
        }

        await _db.SaveChangesAsync(cancellationToken);

        var donation = new Donation
        {
            DonationId = await GetNextDonationIdAsync(cancellationToken),
            SupporterId = supporter.SupporterId,
            DonationType = "Monetary",
            DonationDate = today,
            IsRecurring = request.IsRecurring,
            CampaignName = "Donor Portal",
            ChannelSource = "Donor Portal",
            CurrencyCode = "USD",
            Amount = request.Amount,
            EstimatedValue = request.Amount,
            Notes = $"Donor self-serve gift from {normalizedEmail}"
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync(cancellationToken);

        var allocationForecast = await _donorImpactForecastingService.ForecastAsync(_db, new DonorImpactForecastInput
        {
            Amount = request.Amount,
            IsRecurring = request.IsRecurring,
            ChannelSource = "Donor Portal",
            CampaignName = "Donor Portal",
            CurrencyCode = "USD"
        }, cancellationToken);

        var donationAllocations = BuildSelfServeAllocations(
            donation.DonationId,
            today,
            normalizedEmail,
            await GetNextDonationAllocationIdAsync(cancellationToken),
            allocationForecast);

        if (donationAllocations.Count > 0)
        {
            _db.DonationAllocations.AddRange(donationAllocations);
            await _db.SaveChangesAsync(cancellationToken);
        }

        await tx.CommitAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = donation.DonationId }, donation);
    }

    [HttpPost("self-serve/impact-forecast")]
    [Authorize(Roles = AuthRoles.Donor + "," + AuthRoles.Admin)]
    public async Task<IActionResult> ForecastSelfServeImpact([FromBody] DonorImpactForecastRequest request, CancellationToken cancellationToken)
    {
        if (request.Amount <= 0m)
            return BadRequest(new { message = "Amount must be greater than zero." });

        var forecast = await _donorImpactForecastingService.ForecastAsync(_db, new DonorImpactForecastInput
        {
            Amount = request.Amount,
            IsRecurring = request.IsRecurring,
            ChannelSource = string.IsNullOrWhiteSpace(request.ChannelSource) ? "Donor Portal" : request.ChannelSource,
            CampaignName = string.IsNullOrWhiteSpace(request.CampaignName) ? "Donor Portal" : request.CampaignName,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode
        }, cancellationToken);

        return Ok(new
        {
            estimatedResidentsSupportedThisMonth = forecast.EstimatedResidentsSupportedThisMonth,
            estimatedAllocationPhp = new
            {
                education = forecast.EducationAmount,
                wellbeing = forecast.WellbeingAmount,
                operations = forecast.OperationsAmount,
                outreach = forecast.OutreachAmount
            },
            topArea = forecast.TopArea,
            impactMessage = forecast.ImpactMessage,
            modelVersion = forecast.ModelVersion
        });
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
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
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Donations.FindAsync(id);
        if (item == null) return NotFound();
        _db.Donations.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<int> GetNextSupporterIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.Supporters
            .AsNoTracking()
            .Select(s => (int?)s.SupporterId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }

    private async Task<int> GetNextDonationIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.Donations
            .AsNoTracking()
            .Select(d => (int?)d.DonationId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }

    private async Task<int> GetNextDonationAllocationIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.DonationAllocations
            .AsNoTracking()
            .Select(a => (int?)a.AllocationId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }

    private static List<DonationAllocation> BuildSelfServeAllocations(
        int donationId,
        DateOnly allocationDate,
        string donorEmail,
        int startingAllocationId,
        DonorImpactForecastResult forecast)
    {
        var items = new List<(string ProgramArea, decimal Amount)>
        {
            ("Education", forecast.EducationAmount),
            ("Wellbeing", forecast.WellbeingAmount),
            ("Operations", forecast.OperationsAmount),
            ("Outreach", forecast.OutreachAmount)
        };

        var allocations = new List<DonationAllocation>(items.Count);
        var nextId = startingAllocationId;
        foreach (var item in items)
        {
            if (item.Amount <= 0m)
                continue;

            allocations.Add(new DonationAllocation
            {
                AllocationId = nextId++,
                DonationId = donationId,
                ProgramArea = item.ProgramArea,
                AmountAllocated = Math.Round(item.Amount, 2),
                AllocationDate = allocationDate,
                AllocationNotes = $"Auto allocation from donor self-serve gift ({donorEmail})"
            });
        }

        return allocations;
    }
}
