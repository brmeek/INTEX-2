using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;
using HopeHarbor.Services;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = AuthPolicies.ViewAdminData)]
public class SupportersController : ControllerBase
{
    private readonly HopeHarborContext _db;
    private readonly IDonorChurnScoringService _donorChurnScoringService;
    private readonly IPipelineRunTracker _pipelineRunTracker;

    public SupportersController(
        HopeHarborContext db,
        IDonorChurnScoringService donorChurnScoringService,
        IPipelineRunTracker pipelineRunTracker)
    {
        _db = db;
        _donorChurnScoringService = donorChurnScoringService;
        _pipelineRunTracker = pipelineRunTracker;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status, [FromQuery] string? type, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var q = _db.Supporters.AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(s => s.Status == status);
        if (!string.IsNullOrEmpty(type)) q = q.Where(s => s.SupporterType == type);
        if (!string.IsNullOrEmpty(search)) q = q.Where(s => s.SupporterName != null && s.SupporterName.Contains(search));

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(s => s.SupporterId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var supporterIds = items.Select(i => i.SupporterId).ToArray();
        var churnBySupporterId = await _db.DonorChurnScores
            .Where(s => supporterIds.Contains(s.SupporterId))
            .ToDictionaryAsync(s => s.SupporterId);

        var totalsBySupporterId = await _db.Donations
            .Where(d => d.SupporterId != null && supporterIds.Contains(d.SupporterId.Value))
            .GroupBy(d => d.SupporterId!.Value)
            .Select(g => new { SupporterId = g.Key, Total = g.Sum(d => d.Amount ?? d.EstimatedValue ?? 0m) })
            .ToDictionaryAsync(x => x.SupporterId, x => x.Total);

        var output = items.Select(s =>
        {
            churnBySupporterId.TryGetValue(s.SupporterId, out var churn);
            totalsBySupporterId.TryGetValue(s.SupporterId, out var totalGiven);

            return new
            {
                s.SupporterId,
                s.SupporterName,
                s.SupporterType,
                s.Email,
                s.Phone,
                s.Status,
                s.Region,
                TotalGiven = totalGiven,
                ChurnProbability = churn?.ChurnProbability,
                ChurnPredicted = churn?.ChurnPredicted,
                RiskTier = churn?.RiskTier,
                ChurnScoredAtUtc = churn?.ScoredAtUtc
            };
        });
        return Ok(new { items = output, total, page, pageSize });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await _db.Supporters.Include(s => s.Donations).FirstOrDefaultAsync(s => s.SupporterId == id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] Supporter supporter)
    {
        supporter.SupporterId = 0;
        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = supporter.SupporterId }, supporter);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
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
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Supporters.FindAsync(id);
        if (item == null) return NotFound();
        _db.Supporters.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("churn/refresh")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefreshChurnScores(CancellationToken cancellationToken)
    {
        var initiatedBy = User?.Identity?.Name;
        var runId = await _pipelineRunTracker.StartAsync(
            pipelineName: "donor_churn",
            triggerSource: "manual",
            initiatedBy: initiatedBy,
            modelVersion: _donorChurnScoringService.ModelVersion,
            cancellationToken: cancellationToken);

        try
        {
            var scoredCount = await _donorChurnScoringService.ScoreAllAsync(_db, cancellationToken);
            await _pipelineRunTracker.CompleteSuccessAsync(runId, scoredCount, cancellationToken);

            return Ok(new
            {
                message = "Donor churn scores refreshed.",
                runId,
                scoredCount,
                scoredAtUtc = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            await _pipelineRunTracker.CompleteFailureAsync(runId, ex, CancellationToken.None);
            return StatusCode(500, new
            {
                message = "Donor churn refresh failed.",
                runId
            });
        }
    }
}
