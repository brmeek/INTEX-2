using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SafehousesController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public SafehousesController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var items = await _db.Safehouses.Include(s => s.Residents).OrderBy(s => s.SafehouseId).ToListAsync();
        return Ok(items);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Safehouses.Include(s => s.Residents).FirstOrDefaultAsync(s => s.SafehouseId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Safehouse safehouse)
    {
        _db.Safehouses.Add(safehouse);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = safehouse.SafehouseId }, safehouse);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Safehouse safehouse)
    {
        var existing = await _db.Safehouses.FindAsync(id);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(safehouse);
        existing.SafehouseId = id;
        await _db.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Safehouses.FindAsync(id);
        if (item == null) return NotFound();
        _db.Safehouses.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
