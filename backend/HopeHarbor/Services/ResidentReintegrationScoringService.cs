using HopeHarbor.Data;
using HopeHarbor.Models;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Services;

public interface IResidentReintegrationScoringService
{
    string ModelVersion { get; }
    Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default);
    Task<bool> ScoreResidentAsync(HopeHarborContext db, int residentId, CancellationToken cancellationToken = default);
}

public sealed class ResidentReintegrationScoringService : IResidentReintegrationScoringService
{
    private const string DefaultModelVersion = "reintegration-readiness-v1";

    public string ModelVersion { get; }

    public ResidentReintegrationScoringService(IConfiguration configuration)
    {
        ModelVersion = ResolveModelVersion(
            configuration,
            envKey: "MODEL_VERSION_RESIDENT_REINTEGRATION",
            configKey: "ModelVersions:ResidentReintegration",
            fallback: DefaultModelVersion);
    }

    private sealed class MonthlySnapshot
    {
        public DateOnly MonthStart { get; init; }
        public decimal Score { get; init; }
    }

    private sealed class ProcessSnapshot
    {
        public DateOnly? SessionDate { get; init; }
    }

    public async Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default)
    {
        var residentIds = await db.Residents
            .AsNoTracking()
            .Select(r => r.ResidentId)
            .ToListAsync(cancellationToken);

        foreach (var residentId in residentIds)
            await ScoreResidentInternalAsync(db, residentId, cancellationToken);

        await db.SaveChangesAsync(cancellationToken);
        return residentIds.Count;
    }

    public async Task<bool> ScoreResidentAsync(HopeHarborContext db, int residentId, CancellationToken cancellationToken = default)
    {
        var exists = await db.Residents.AsNoTracking().AnyAsync(r => r.ResidentId == residentId, cancellationToken);
        if (!exists) return false;

        await ScoreResidentInternalAsync(db, residentId, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        return true;
    }

    private async Task ScoreResidentInternalAsync(HopeHarborContext db, int residentId, CancellationToken cancellationToken)
    {
        var resident = await db.Residents
            .AsNoTracking()
            .FirstAsync(r => r.ResidentId == residentId, cancellationToken);

        var educationRows = await db.EducationRecords
            .AsNoTracking()
            .Where(e => e.ResidentId == residentId)
            .OrderByDescending(e => e.RecordDate)
            .Take(12)
            .ToListAsync(cancellationToken);

        var healthRows = await db.HealthWellbeingRecords
            .AsNoTracking()
            .Where(h => h.ResidentId == residentId)
            .OrderByDescending(h => h.RecordDate)
            .Take(12)
            .ToListAsync(cancellationToken);

        var processRows = await db.ProcessRecordings
            .AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .Select(p => new ProcessSnapshot
            {
                SessionDate = p.SessionDate
            })
            .ToListAsync(cancellationToken);

        var visitRows = await db.HomeVisitations
            .AsNoTracking()
            .Where(v => v.ResidentId == residentId)
            .OrderByDescending(v => v.VisitDate)
            .Take(24)
            .ToListAsync(cancellationToken);

        var incidentRows = await db.IncidentReports
            .AsNoTracking()
            .Where(i => i.ResidentId == residentId)
            .OrderByDescending(i => i.IncidentDate)
            .Take(24)
            .ToListAsync(cancellationToken);

        var planRows = await db.InterventionPlans
            .AsNoTracking()
            .Where(p => p.ResidentId == residentId)
            .OrderByDescending(p => p.CaseConferenceDate)
            .Take(24)
            .ToListAsync(cancellationToken);

        var now = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var sixMonthsAgo = now.AddMonths(-6);

        var latestProgress = educationRows
            .Where(e => e.ProgressPercent != null)
            .Select(e => e.ProgressPercent!.Value)
            .DefaultIfEmpty(0m)
            .FirstOrDefault();

        var latestHealth = healthRows
            .Where(h => h.GeneralHealthScore != null)
            .Select(h => h.GeneralHealthScore!.Value)
            .DefaultIfEmpty(0m)
            .FirstOrDefault();

        var hasEmergencyVisit = visitRows.Any(v =>
            v.VisitDate != null
            && v.VisitDate.Value >= sixMonthsAgo
            && (v.VisitType?.Contains("Emergency", StringComparison.OrdinalIgnoreCase) ?? false));

        var incidentsLast6m = incidentRows.Count(i => i.IncidentDate != null && i.IncidentDate.Value >= sixMonthsAgo);
        var sessionsLast3m = processRows.Count(p => p.SessionDate != null && p.SessionDate.Value >= now.AddMonths(-3));
        var plansCompleted = planRows.Count(p => string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase));
        var plansOpen = planRows.Count(p => !string.Equals(p.Status, "Completed", StringComparison.OrdinalIgnoreCase));

        var riskScore = GetRiskScore(resident.CaseCategory);
        var vulnerabilityPenalty =
            (resident.HasDisability == true ? 0.08m : 0m)
            + (resident.IsInformalSettler == true ? 0.06m : 0m)
            + (resident.IsSoloParentChild == true ? 0.04m : 0m)
            + (resident.IsIndigenous == true ? 0.03m : 0m);

        var readiness = 0.22m
                        + (0.0035m * latestProgress)
                        + (0.015m * latestHealth)
                        + (0.028m * sessionsLast3m)
                        + (0.04m * plansCompleted)
                        - (0.05m * plansOpen)
                        - (0.07m * incidentsLast6m)
                        - (hasEmergencyVisit ? 0.15m : 0m)
                        - (0.16m * riskScore)
                        - vulnerabilityPenalty;

        var readinessScore = Math.Round(Math.Clamp(readiness, 0m, 1m), 4);

        var tier = readinessScore >= 0.70m
            ? "High Readiness"
            : readinessScore >= 0.45m
                ? "Needs Monitoring"
                : "At Risk";

        var topConcernFeature = DetermineTopConcernFeature(
            hasEmergencyVisit,
            incidentsLast6m,
            latestHealth,
            latestProgress,
            plansOpen);

        var monthlyHistory = BuildMonthlyHistory(educationRows, healthRows, incidentRows, processRows);
        var trajectory = ComputeTrajectory(monthlyHistory);

        var existing = await db.ResidentReintegrationScores
            .FirstOrDefaultAsync(r => r.ResidentId == residentId, cancellationToken);

        if (existing == null)
        {
            existing = new ResidentReintegrationScore { ResidentId = residentId };
            db.ResidentReintegrationScores.Add(existing);
        }

        existing.ReadinessScore = readinessScore;
        existing.ReadinessTier = tier;
        existing.TopConcernFeature = topConcernFeature;
        existing.TrendLabel = trajectory.TrendLabel;
        existing.HistoryMonthsUsed = trajectory.HistoryMonthsUsed;
        existing.MonthOverMonthChange = trajectory.MonthOverMonthChange;
        existing.FirstVsLatestChange = trajectory.FirstVsLatestChange;
        existing.InitialVsLatestChange = trajectory.InitialVsLatestChange;
        existing.TrajectorySlope = trajectory.TrajectorySlope;
        existing.ScoredAtUtc = DateTime.UtcNow;
        existing.ModelVersion = ModelVersion;
    }

    private static decimal GetRiskScore(string? caseCategory)
        => caseCategory?.ToLowerInvariant() switch
        {
            "trafficked" => 1.0m,
            "sexualabuse" => 0.9m,
            "physicalabuse" => 0.8m,
            "abandoned" => 0.65m,
            "neglected" => 0.55m,
            _ => 0.5m
        };

    private static string DetermineTopConcernFeature(
        bool hasEmergencyVisit,
        int incidentsLast6m,
        decimal latestHealth,
        decimal latestProgress,
        int plansOpen)
    {
        if (hasEmergencyVisit) return "has_emergency_visit";
        if (incidentsLast6m >= 2) return "high_incident_count";
        if (latestHealth < 5m) return "low_general_health_score";
        if (latestProgress < 50m) return "low_education_progress";
        if (plansOpen > 3) return "many_open_interventions";
        return "none";
    }

    private static List<MonthlySnapshot> BuildMonthlyHistory(
        IReadOnlyCollection<EducationRecord> educationRows,
        IReadOnlyCollection<HealthWellbeingRecord> healthRows,
        IReadOnlyCollection<IncidentReport> incidentRows,
        IReadOnlyCollection<ProcessSnapshot> processRows)
    {
        var monthStarts = Enumerable.Range(0, 4)
            .Select(i =>
            {
                var dt = DateTime.UtcNow.Date.AddMonths(-i);
                return new DateOnly(dt.Year, dt.Month, 1);
            })
            .OrderBy(d => d)
            .ToArray();

        var snapshots = new List<MonthlySnapshot>(4);
        foreach (var month in monthStarts)
        {
            var nextMonth = month.AddMonths(1);
            var monthEdu = educationRows
                .Where(e => e.RecordDate != null && e.RecordDate.Value >= month && e.RecordDate.Value < nextMonth)
                .Select(e => e.ProgressPercent ?? 0m)
                .DefaultIfEmpty(0m)
                .Average();

            var monthHealth = healthRows
                .Where(h => h.RecordDate != null && h.RecordDate.Value >= month && h.RecordDate.Value < nextMonth)
                .Select(h => h.GeneralHealthScore ?? 0m)
                .DefaultIfEmpty(0m)
                .Average();

            var monthIncidents = incidentRows.Count(i => i.IncidentDate != null && i.IncidentDate.Value >= month && i.IncidentDate.Value < nextMonth);
            var monthSessions = processRows.Count(p => p.SessionDate != null && p.SessionDate.Value >= month && p.SessionDate.Value < nextMonth);

            var score = 0.18m
                        + (0.0038m * monthEdu)
                        + (0.018m * monthHealth)
                        + (0.025m * monthSessions)
                        - (0.06m * monthIncidents);

            snapshots.Add(new MonthlySnapshot
            {
                MonthStart = month,
                Score = Math.Round(Math.Clamp(score, 0m, 1m), 4)
            });
        }

        return snapshots;
    }

    private static (string TrendLabel, int HistoryMonthsUsed, decimal? MonthOverMonthChange, decimal? FirstVsLatestChange, decimal? InitialVsLatestChange, decimal? TrajectorySlope) ComputeTrajectory(
        IReadOnlyList<MonthlySnapshot> monthlyHistory)
    {
        var recent = monthlyHistory.Select(m => m.Score).ToArray();
        if (recent.Length < 3)
        {
            return ("Insufficient History", recent.Length, null, null, null, null);
        }

        var monthOverMonth = recent[^1] - recent[^2];
        var firstVsLatest = recent[^1] - recent[0];
        var slope = recent.Length > 1 ? (recent[^1] - recent[0]) / (recent.Length - 1) : 0m;

        var label = slope switch
        {
            >= 0.03m => "Improving",
            >= 0.00m => "Stable",
            > -0.03m => "Early Decline",
            _ => "Declining"
        };

        return (
            label,
            recent.Length,
            Math.Round(monthOverMonth, 4),
            Math.Round(firstVsLatest, 4),
            Math.Round(firstVsLatest, 4),
            Math.Round(slope, 4));
    }

    private static string ResolveModelVersion(
        IConfiguration configuration,
        string envKey,
        string configKey,
        string fallback)
    {
        var configured = configuration[envKey];
        if (string.IsNullOrWhiteSpace(configured))
            configured = configuration[configKey];

        return string.IsNullOrWhiteSpace(configured) ? fallback : configured.Trim();
    }
}
