using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/home-visitations")]
[Route("api/visitations")]
[Route("api/visits")]
[Authorize(Policy = AuthPolicies.ViewAdminData)]
public class HomeVisitationsController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public HomeVisitationsController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] string? visitType, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.HomeVisitations.Include(v => v.Resident).AsQueryable();
        if (residentId.HasValue) q = q.Where(v => v.ResidentId == residentId);
        if (!string.IsNullOrEmpty(visitType)) q = q.Where(v => v.VisitType == visitType);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(v => v.VisitDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.HomeVisitations.Include(v => v.Resident).FirstOrDefaultAsync(v => v.VisitationId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] HomeVisitation visitation, CancellationToken cancellationToken)
    {
        if (visitation.VisitationId <= 0)
            visitation.VisitationId = await GetNextVisitationIdAsync(cancellationToken);

        _db.HomeVisitations.Add(visitation);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = visitation.VisitationId }, visitation);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] HomeVisitation visitation, CancellationToken cancellationToken)
    {
        var existing = await _db.HomeVisitations.FindAsync([id], cancellationToken);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(visitation);
        existing.VisitationId = id;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await _db.HomeVisitations.FindAsync([id], cancellationToken);
        if (item == null) return NotFound();
        _db.HomeVisitations.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<int> GetNextVisitationIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.HomeVisitations
            .AsNoTracking()
            .Select(v => (int?)v.VisitationId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }
}
