using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthPolicies.ViewAdminData)]
public class ProcessRecordingsController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public ProcessRecordingsController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? residentId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.ProcessRecordings.Include(p => p.Resident).AsQueryable();
        if (residentId.HasValue) q = q.Where(p => p.ResidentId == residentId);

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(p => p.SessionDate).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.ProcessRecordings.Include(p => p.Resident).FirstOrDefaultAsync(p => p.RecordingId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] ProcessRecording recording)
    {
        recording.CreatedAt = DateTime.UtcNow;
        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = recording.RecordingId }, recording);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] ProcessRecording recording)
    {
        var existing = await _db.ProcessRecordings.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(recording);
        existing.RecordingId = id;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.ProcessRecordings.FindAsync(id);
        if (item == null) return NotFound();
        _db.ProcessRecordings.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
