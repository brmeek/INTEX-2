using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InterventionPlansController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public InterventionPlansController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.InterventionPlans.Include(p => p.Resident).AsQueryable();
        if (residentId.HasValue) q = q.Where(p => p.ResidentId == residentId);
        if (!string.IsNullOrEmpty(status)) q = q.Where(p => p.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(p => p.CaseConferenceDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.InterventionPlans.Include(p => p.Resident).FirstOrDefaultAsync(p => p.PlanId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] InterventionPlan plan)
    {
        plan.CreatedAt = DateTime.UtcNow;
        plan.UpdatedAt = DateTime.UtcNow;
        _db.InterventionPlans.Add(plan);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = plan.PlanId }, plan);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] InterventionPlan plan)
    {
        var existing = await _db.InterventionPlans.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(plan);
        existing.PlanId = id;
        existing.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.InterventionPlans.FindAsync(id);
        if (item == null) return NotFound();
        _db.InterventionPlans.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
