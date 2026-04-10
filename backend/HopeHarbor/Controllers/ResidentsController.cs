using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Models;
using HopeHarbor.Services;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/caseload")]
[Route("api/case-load")]
[Authorize(Policy = AuthPolicies.ViewAdminData)]
public class ResidentsController : ControllerBase
{
    private static int _readinessRefreshInProgress;
    private readonly HopeHarborContext _db;
    private readonly IResidentReintegrationScoringService _residentReintegrationScoringService;
    private readonly IPipelineRunTracker _pipelineRunTracker;
    private readonly IServiceScopeFactory _scopeFactory;

    public ResidentsController(
        HopeHarborContext db,
        IResidentReintegrationScoringService residentReintegrationScoringService,
        IPipelineRunTracker pipelineRunTracker,
        IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _residentReintegrationScoringService = residentReintegrationScoringService;
        _pipelineRunTracker = pipelineRunTracker;
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
                Gender = NormalizeGenderForClient(r.Gender),
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

    [HttpGet("{id}/dashboard")]
    public async Task<IActionResult> GetDashboard(int id)
    {
        var resident = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .Include(r => r.EducationRecords)
            .Include(r => r.HealthRecords)
            .Include(r => r.InterventionPlans)
            .Include(r => r.ProcessRecordings)
            .Include(r => r.HomeVisitations)
            .FirstOrDefaultAsync(r => r.ResidentId == id);

        if (resident is null)
            return NotFound();

        var readiness = await _db.ResidentReintegrationScores
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.ResidentId == id);

        var educationTimeline = (resident.EducationRecords ?? [])
            .Where(e => e.RecordDate.HasValue)
            .OrderBy(e => e.RecordDate)
            .Select(e => new
            {
                date = e.RecordDate,
                progressPercent = e.ProgressPercent,
                attendanceRate = e.AttendanceRate,
                enrollmentStatus = e.EnrollmentStatus
            })
            .ToList();

        var wellbeingTimeline = (resident.HealthRecords ?? [])
            .Where(h => h.RecordDate.HasValue)
            .OrderBy(h => h.RecordDate)
            .Select(h => new
            {
                date = h.RecordDate,
                generalHealthScore = h.GeneralHealthScore,
                nutritionScore = h.NutritionScore,
                sleepQualityScore = h.SleepQualityScore,
                energyLevelScore = h.EnergyLevelScore
            })
            .ToList();

        var monthlyActivity = new Dictionary<DateOnly, (int ProcessSessions, int HomeVisits)>();

        foreach (var session in resident.ProcessRecordings ?? [])
        {
            if (!session.SessionDate.HasValue) continue;
            var key = new DateOnly(session.SessionDate.Value.Year, session.SessionDate.Value.Month, 1);
            monthlyActivity.TryGetValue(key, out var current);
            monthlyActivity[key] = (current.ProcessSessions + 1, current.HomeVisits);
        }

        foreach (var visit in resident.HomeVisitations ?? [])
        {
            if (!visit.VisitDate.HasValue) continue;
            var key = new DateOnly(visit.VisitDate.Value.Year, visit.VisitDate.Value.Month, 1);
            monthlyActivity.TryGetValue(key, out var current);
            monthlyActivity[key] = (current.ProcessSessions, current.HomeVisits + 1);
        }

        var activityTimeline = monthlyActivity
            .OrderBy(kv => kv.Key)
            .Select(kv => new
            {
                month = kv.Key,
                processSessions = kv.Value.ProcessSessions,
                homeVisits = kv.Value.HomeVisits
            })
            .ToList();

        var recentProcessRecordings = (resident.ProcessRecordings ?? [])
            .Where(p => p.SessionDate.HasValue)
            .OrderByDescending(p => p.SessionDate)
            .Take(8)
            .Select(p => new
            {
                p.RecordingId,
                p.SessionDate,
                p.SocialWorker,
                p.SessionType,
                p.EmotionalState,
                p.FollowUpActions
            })
            .ToList();

        var recentVisitations = (resident.HomeVisitations ?? [])
            .Where(v => v.VisitDate.HasValue)
            .OrderByDescending(v => v.VisitDate)
            .Take(8)
            .Select(v => new
            {
                v.VisitationId,
                v.VisitDate,
                v.VisitType,
                v.VisitOutcome,
                v.FollowUpNeeded,
                v.SocialWorker
            })
            .ToList();

        var response = new
        {
            resident.ResidentId,
            resident.FirstName,
            resident.LastName,
            resident.DateOfBirth,
            Gender = NormalizeGenderForClient(resident.Gender),
            resident.AdmissionDate,
            resident.CaseStatus,
            resident.CaseCategory,
            resident.CaseSubcategory,
            resident.SafehouseId,
            resident.AssignedSocialWorker,
            resident.ReintegrationStatus,
            resident.ReferralSource,
            safehouse = resident.Safehouse is null
                ? null
                : new
                {
                    resident.Safehouse.SafehouseId,
                    resident.Safehouse.SafehouseName,
                    resident.Safehouse.Location,
                    resident.Safehouse.Region
                },
            readiness = readiness is null
                ? null
                : new
                {
                    readiness.ReadinessScore,
                    readiness.ReadinessTier,
                    readiness.TrendLabel,
                    readiness.TopConcernFeature,
                    readiness.HistoryMonthsUsed,
                    readiness.MonthOverMonthChange,
                    readiness.FirstVsLatestChange,
                    readiness.TrajectorySlope,
                    readiness.ScoredAtUtc,
                    readiness.ModelVersion
                },
            educationTimeline,
            wellbeingTimeline,
            activityTimeline,
            recentProcessRecordings,
            recentVisitations
        };

        return Ok(response);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Create([FromBody] Resident resident, CancellationToken cancellationToken)
    {
        if (resident.ResidentId <= 0)
            resident.ResidentId = await GetNextResidentIdAsync(cancellationToken);

        resident.Gender = NormalizeGenderForStorage(resident.Gender);
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(Get), new { id = resident.ResidentId }, resident);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Update(int id, [FromBody] Resident resident, CancellationToken cancellationToken)
    {
        var existing = await _db.Residents.FindAsync([id], cancellationToken);
        if (existing == null) return NotFound();
        resident.Gender = NormalizeGenderForStorage(resident.Gender);
        _db.Entry(existing).CurrentValues.SetValues(resident);
        existing.ResidentId = id;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.ManageCatalog)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var item = await _db.Residents.FindAsync([id], cancellationToken);
        if (item == null) return NotFound();
        _db.Residents.Remove(item);
        await _db.SaveChangesAsync(cancellationToken);
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

        var initiatedBy = User?.Identity?.Name;
        var runId = await _pipelineRunTracker.StartAsync(
            pipelineName: "resident_reintegration",
            triggerSource: "manual",
            initiatedBy: initiatedBy,
            modelVersion: "reintegration-readiness-v1",
            cancellationToken: CancellationToken.None);

        _ = Task.Run(async () =>
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
                var scoringService = scope.ServiceProvider.GetRequiredService<IResidentReintegrationScoringService>();
                var pipelineRunTracker = scope.ServiceProvider.GetRequiredService<IPipelineRunTracker>();

                var scoredCount = await scoringService.ScoreAllAsync(db, CancellationToken.None);
                await pipelineRunTracker.CompleteSuccessAsync(runId, scoredCount, CancellationToken.None);
            }
            catch (Exception ex)
            {
                try
                {
                    using var errorScope = _scopeFactory.CreateScope();
                    var pipelineRunTracker = errorScope.ServiceProvider.GetRequiredService<IPipelineRunTracker>();
                    await pipelineRunTracker.CompleteFailureAsync(runId, ex, CancellationToken.None);
                }
                catch
                {
                    // Best-effort tracker update.
                }
            }
            finally
            {
                Interlocked.Exchange(ref _readinessRefreshInProgress, 0);
            }
        });

        return Ok(new
        {
            message = "Resident reintegration readiness refresh started.",
            runId,
            inProgress = true,
            scoredAtUtc = DateTime.UtcNow
        });
    }

    [HttpPost("{id}/readiness/refresh")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefreshResidentReadinessScore(int id, CancellationToken cancellationToken)
    {
        var initiatedBy = User?.Identity?.Name;
        var runId = await _pipelineRunTracker.StartAsync(
            pipelineName: "resident_reintegration",
            triggerSource: "manual",
            initiatedBy: initiatedBy,
            modelVersion: "reintegration-readiness-v1",
            cancellationToken: cancellationToken);

        try
        {
            var scored = await _residentReintegrationScoringService.ScoreResidentAsync(_db, id, cancellationToken);
            if (!scored)
            {
                await _pipelineRunTracker.CompleteFailureAsync(
                    runId,
                    new InvalidOperationException($"Resident {id} was not found for readiness scoring."),
                    CancellationToken.None);
                return NotFound();
            }

            await _pipelineRunTracker.CompleteSuccessAsync(runId, 1, cancellationToken);

            return Ok(new
            {
                message = "Resident reintegration readiness score refreshed.",
                runId,
                residentId = id,
                scoredAtUtc = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            await _pipelineRunTracker.CompleteFailureAsync(runId, ex, CancellationToken.None);
            return StatusCode(500, new
            {
                message = "Resident reintegration readiness scoring failed.",
                runId,
                residentId = id
            });
        }
    }

    private async Task<int> GetNextResidentIdAsync(CancellationToken cancellationToken)
    {
        var max = await _db.Residents
            .AsNoTracking()
            .Select(r => (int?)r.ResidentId)
            .MaxAsync(cancellationToken);
        return (max ?? 0) + 1;
    }

    private static string? NormalizeGenderForStorage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var normalized = value.Trim();
        if (normalized.Equals("Female", StringComparison.OrdinalIgnoreCase))
            return "F";
        if (normalized.Equals("Male", StringComparison.OrdinalIgnoreCase))
            return "M";

        return normalized[..1].ToUpperInvariant();
    }

    private static string? NormalizeGenderForClient(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return value;

        return value.Trim().ToUpperInvariant() switch
        {
            "F" => "Female",
            "M" => "Male",
            _ => value
        };
    }
}
