using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/partner")]
[Route("api/partners-admin")]
[Authorize(Policy = AuthPolicies.ViewAdminData)]
public class PartnersController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public PartnersController(HopeHarborContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Partners.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(p => p.Status == status);

        var total = await q.CountAsync();
        var items = await q.OrderBy(p => p.PartnerName).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return Ok(new { items, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Partners.Include(p => p.Assignments).FirstOrDefaultAsync(p => p.PartnerId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] Partner partner, CancellationToken cancellationToken)
    {
        if (partner.PartnerId <= 0)
            partner.PartnerId = await GetNextPartnerIdAsync(cancellationToken);

        _db.Partners.Add(partner);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = partner.PartnerId }, partner);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] Partner partner, CancellationToken cancellationToken)
    {
        var existing = await _db.Partners.FindAsync([id], cancellationToken);
        if (existing == null) return NotFound();
        _db.Entry(existing).CurrentValues.SetValues(partner);
        existing.PartnerId = id;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await _db.Partners.FindAsync([id], cancellationToken);
        if (item == null) return NotFound();
        _db.Partners.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<int> GetNextPartnerIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.Partners
            .AsNoTracking()
            .Select(p => (int?)p.PartnerId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }
}
