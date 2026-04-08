using HopeHarbor.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class HeatmapController : ControllerBase
{
    private readonly HopeHarborContext _db;

    public HeatmapController(HopeHarborContext db)
    {
        _db = db;
    }

    [HttpGet("live")]
    public async Task<IActionResult> Live(CancellationToken cancellationToken)
    {
        var regions = await _db.RegionalRiskSnapshots
            .OrderByDescending(r => r.RiskScore)
            .Select(r => new
            {
                region = r.Region,
                risk_score = Math.Round(r.RiskScore, 1),
                source_pipeline = r.SourcePipeline,
                updated_at = r.UpdatedAtUtc
            })
            .ToListAsync(cancellationToken);

        var lastUpdated = regions.Count == 0
            ? (DateTime?)null
            : regions.Max(r => r.updated_at);

        return Ok(new
        {
            regions,
            last_updated = lastUpdated
        });
    }
}
