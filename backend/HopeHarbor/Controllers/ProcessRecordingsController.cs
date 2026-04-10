using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/process-recordings")]
[Route("api/process-recording")]
[Route("api/proccess-recordings")]
[Route("api/proccess-recording")]
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
    public async Task<IActionResult> Create([FromBody] ProcessRecording recording, CancellationToken cancellationToken)
    {
        if (recording.RecordingId <= 0)
            recording.RecordingId = await GetNextRecordingIdAsync(cancellationToken);

        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = recording.RecordingId }, recording);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] ProcessRecording recording, CancellationToken cancellationToken)
    {
        var existing = await _db.ProcessRecordings.FindAsync([id], cancellationToken);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(recording);
        existing.RecordingId = id;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await _db.ProcessRecordings.FindAsync([id], cancellationToken);
        if (item == null) return NotFound();
        _db.ProcessRecordings.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<int> GetNextRecordingIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.ProcessRecordings
            .AsNoTracking()
            .Select(r => (int?)r.RecordingId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }
}
