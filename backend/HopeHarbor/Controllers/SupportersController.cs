using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupportersController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public SupportersController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? type, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Supporters.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        if (!string.IsNullOrEmpty(type)) q = q.Where(s => s.SupporterType == type);
        if (!string.IsNullOrEmpty(search)) q = q.Where(s => s.SupporterName != null && s.SupporterName.Contains(search));

        var total = await q.CountAsync();
        var items = await q.OrderByDescending(s => s.SupporterId).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Supporters.Include(s => s.Donations).FirstOrDefaultAsync(s => s.SupporterId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] Supporter supporter)
    {
        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] Supporter supporter)
    {
        var existing = await _db.Supporters.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(supporter);
        existing.SupporterId = id;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Supporters.FindAsync(id);
        if (item == null) return NotFound();
        _db.Supporters.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
