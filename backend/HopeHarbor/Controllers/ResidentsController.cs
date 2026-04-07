using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public ResidentsController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? caseStatus, [FromQuery] string? caseCategory,
        [FromQuery] int? safehouseId, [FromQuery] string? search,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Residents.Include(r => r.Safehouse).AsQueryable();
        if (!string.IsNullOrEmpty(caseStatus)) q = q.Where(r => r.CaseStatus == caseStatus);
        if (!string.IsNullOrEmpty(caseCategory)) q = q.Where(r => r.CaseCategory == caseCategory);
        if (safehouseId.HasValue) q = q.Where(r => r.SafehouseId == safehouseId);
        if (!string.IsNullOrEmpty(search))
            q = q.Where(r => (r.FirstName != null && r.FirstName.Contains(search)) || (r.LastName != null && r.LastName.Contains(search)));

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(r => r.AdmissionDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Residents
            .Include(r => r.Safehouse)
            .Include(r => r.EducationRecords!.OrderByDescending(e => e.RecordDate))
            .Include(r => r.HealthRecords!.OrderByDescending(h => h.RecordDate))
            .Include(r => r.InterventionPlans)
            .Include(r => r.ProcessRecordings!.OrderByDescending(p => p.SessionDate))
            .Include(r => r.HomeVisitations!.OrderByDescending(v => v.VisitDate))
            .Include(r => r.IncidentReports!.OrderByDescending(i => i.IncidentDate))
            .FirstOrDefaultAsync(r => r.ResidentId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Resident resident)
    {
        var existing = await _db.Residents.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(resident);
        existing.ResidentId = id;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Residents.FindAsync(id);
        if (item == null) return NotFound();
        _db.Residents.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
