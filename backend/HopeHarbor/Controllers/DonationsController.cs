using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DonationsController : ControllerBase
{
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

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = donation.DonationId }, donation);
    }

    [HttpPut("{id}")]
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
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Donations.FindAsync(id);
        if (item == null) return NotFound();
        _db.Donations.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
