using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;
using HopeHarbor.Services;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private static int _readinessRefreshInProgress;
    private readonly HopeHarborContext _db;
    private readonly IResidentReintegrationScoringService _residentReintegrationScoringService;
    private readonly IServiceScopeFactory _scopeFactory;

    public ResidentsController(
        HopeHarborContext db,
        IResidentReintegrationScoringService residentReintegrationScoringService,
        IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _residentReintegrationScoringService = residentReintegrationScoringService;
        _scopeFactory = scopeFactory;
    }

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
        var items = await q
            .OrderByDescending(r => r.AdmissionDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var residentIds = items.Select(r => r.ResidentId).ToArray();
        var readinessByResidentId = await _db.ResidentReintegrationScores
            .Where(s => residentIds.Contains(s.ResidentId))
            .ToDictionaryAsync(s => s.ResidentId);

        var output = items.Select(r =>
        {
            readinessByResidentId.TryGetValue(r.ResidentId, out var readiness);
            return new
            {
                r.ResidentId,
                r.FirstName,
                r.LastName,
                r.DateOfBirth,
                r.Gender,
                r.AdmissionDate,
                r.CaseStatus,
                r.CaseCategory,
                r.CaseSubcategory,
                r.HasDisability,
                r.Is4PsBeneficiary,
                r.IsSoloParentChild,
                r.IsIndigenous,
                r.IsInformalSettler,
                r.SafehouseId,
                r.AssignedSocialWorker,
                r.ReintegrationStatus,
                r.ReferralSource,
                r.Safehouse,
                ReadinessScore = readiness?.ReadinessScore,
                ReadinessTier = readiness?.ReadinessTier,
                TrendLabel = readiness?.TrendLabel,
                MonthOverMonthChange = readiness?.MonthOverMonthChange,
                FirstVsLatestChange = readiness?.FirstVsLatestChange,
                InitialVsLatestChange = readiness?.InitialVsLatestChange,
                TrajectorySlope = readiness?.TrajectorySlope,
                HistoryMonthsUsed = readiness?.HistoryMonthsUsed,
                TopConcernFeature = readiness?.TopConcernFeature,
                ReadinessScoredAtUtc = readiness?.ScoredAtUtc
            };
        });

        return Ok(new { items = output, total, page, pageSize });
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
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
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
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id)
    {
        var item = await _db.Residents.FindAsync(id);
        if (item == null) return NotFound();
        _db.Residents.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("readiness/refresh")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefreshAllReadinessScores(CancellationToken cancellationToken)
    {
        if (Interlocked.CompareExchange(ref _readinessRefreshInProgress, 1, 0) == 1)
        {
            return Conflict(new
            {
                message = "Readiness refresh is already running.",
                startedAtUtc = DateTime.UtcNow
            });
        }

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
                var scoringService = scope.ServiceProvider.GetRequiredService<IResidentReintegrationScoringService>();
                await scoringService.ScoreAllAsync(db, CancellationToken.None);
            }
            catch
            {
                // Keep this endpoint resilient even if background scoring fails.
            }
            finally
            {
                Interlocked.Exchange(ref _readinessRefreshInProgress, 0);
            }
        });

        return Ok(new
        {
            message = "Resident reintegration readiness refresh started.",
            inProgress = true,
            scoredAtUtc = DateTime.UtcNow
        });
    }

    [HttpPost("{id}/readiness/refresh")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefreshResidentReadinessScore(int id, CancellationToken cancellationToken)
    {
        var scored = await _residentReintegrationScoringService.ScoreResidentAsync(_db, id, cancellationToken);
        if (!scored) return NotFound();

        return Ok(new
        {
            message = "Resident reintegration readiness score refreshed.",
            residentId = id,
            scoredAtUtc = DateTime.UtcNow
        });
    }
}
