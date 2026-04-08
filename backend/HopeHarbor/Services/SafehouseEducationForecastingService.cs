using HopeHarbor.Data;
using HopeHarbor.Models;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Services;

public interface ISafehouseEducationForecastingService
{
    Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default);
    Task<SafehouseEducationForecastEvaluation> EvaluateAsync(HopeHarborContext db, CancellationToken cancellationToken = default);
}

public sealed class SafehouseEducationForecastEvaluation
{
    public decimal Mae { get; init; }
    public decimal Rmse { get; init; }
    public int ObservationCount { get; init; }
    public int SafehouseCount { get; init; }
}

public sealed class SafehouseEducationForecastingService : ISafehouseEducationForecastingService
{
    private const string ModelVersion = "safehouse-education-forecast-v2";

    private sealed class EducationSnapshot
    {
        public DateOnly RecordDate { get; init; }
        public decimal ProgressPercent { get; init; }
    }

    public async Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default)
    {
        var globalBaseline = await LoadGlobalBaselineAsync(db, cancellationToken);

        var safehouses = await db.Safehouses
            .AsNoTracking()
            .Select(s => new { s.SafehouseId })
            .ToListAsync(cancellationToken);

        foreach (var safehouse in safehouses)
        {
            await ScoreSafehouseInternalAsync(db, safehouse.SafehouseId, globalBaseline, cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        return safehouses.Count;
    }

    public async Task<SafehouseEducationForecastEvaluation> EvaluateAsync(HopeHarborContext db, CancellationToken cancellationToken = default)
    {
        var snapshots = await (
                from resident in db.Residents.AsNoTracking()
                join education in db.EducationRecords.AsNoTracking() on resident.ResidentId equals education.ResidentId
                where resident.SafehouseId != null
                      && education.RecordDate != null
                      && education.ProgressPercent != null
                select new
                {
                    SafehouseId = resident.SafehouseId!.Value,
                    RecordDate = education.RecordDate!.Value,
                    ProgressPercent = education.ProgressPercent!.Value
                })
            .ToListAsync(cancellationToken);

        if (snapshots.Count == 0)
        {
            return new SafehouseEducationForecastEvaluation
            {
                Mae = 0m,
                Rmse = 0m,
                ObservationCount = 0,
                SafehouseCount = 0
            };
        }

        var globalBaseline = await LoadGlobalBaselineAsync(db, cancellationToken);

        var bySafehouse = snapshots
            .GroupBy(s => s.SafehouseId)
            .ToList();

        var absoluteErrors = new List<decimal>();
        var squaredErrors = new List<decimal>();
        var safehousesWithEvaluations = 0;

        foreach (var safehouseGroup in bySafehouse)
        {
            var monthlyAverages = safehouseGroup
                .GroupBy(x => new DateOnly(x.RecordDate.Year, x.RecordDate.Month, 1))
                .Select(g => new
                {
                    Month = g.Key,
                    Avg = g.Average(v => v.ProgressPercent)
                })
                .OrderBy(x => x.Month)
                .ToList();

            if (monthlyAverages.Count < 2)
                continue;

            safehousesWithEvaluations++;

            for (var i = 1; i < monthlyAverages.Count; i++)
            {
                var history = monthlyAverages
                    .Take(i)
                    .Select(x => x.Avg)
                    .ToList();

                var predicted = PredictNextFromHistory(history, globalBaseline);
                var actual = monthlyAverages[i].Avg;
                var error = predicted - actual;

                absoluteErrors.Add(Math.Abs(error));
                squaredErrors.Add(error * error);
            }
        }

        if (absoluteErrors.Count == 0)
        {
            return new SafehouseEducationForecastEvaluation
            {
                Mae = 0m,
                Rmse = 0m,
                ObservationCount = 0,
                SafehouseCount = safehousesWithEvaluations
            };
        }

        var mae = Math.Round(absoluteErrors.Average(), 2);
        var rmse = Math.Round((decimal)Math.Sqrt((double)squaredErrors.Average()), 2);

        return new SafehouseEducationForecastEvaluation
        {
            Mae = mae,
            Rmse = rmse,
            ObservationCount = absoluteErrors.Count,
            SafehouseCount = safehousesWithEvaluations
        };
    }

    private static async Task ScoreSafehouseInternalAsync(
        HopeHarborContext db,
        int safehouseId,
        decimal globalBaseline,
        CancellationToken cancellationToken)
    {
        var snapshots = await (
                from resident in db.Residents.AsNoTracking()
                join education in db.EducationRecords.AsNoTracking() on resident.ResidentId equals education.ResidentId
                where resident.SafehouseId == safehouseId
                      && education.RecordDate != null
                      && education.ProgressPercent != null
                select new EducationSnapshot
                {
                    RecordDate = education.RecordDate!.Value,
                    ProgressPercent = education.ProgressPercent!.Value
                })
            .ToListAsync(cancellationToken);

        var monthStarts = Enumerable.Range(0, 6)
            .Select(i =>
            {
                var dt = DateTime.UtcNow.Date.AddMonths(-i);
                return new DateOnly(dt.Year, dt.Month, 1);
            })
            .OrderBy(m => m)
            .ToArray();

        var monthlyAverages = monthStarts
            .Select(month =>
            {
                var nextMonth = month.AddMonths(1);
                var monthValues = snapshots
                    .Where(s => s.RecordDate >= month && s.RecordDate < nextMonth)
                    .Select(s => s.ProgressPercent)
                    .ToList();

                return new
                {
                    Month = month,
                    Avg = monthValues.Count > 0 ? monthValues.Average() : (decimal?)null
                };
            })
            .Where(x => x.Avg != null)
            .Select(x => new { x.Month, Avg = x.Avg!.Value })
            .ToList();

        var latestObserved = monthlyAverages.Count > 0 ? monthlyAverages[^1].Avg : 0m;
        var previousObserved = monthlyAverages.Count > 1 ? monthlyAverages[^2].Avg : (decimal?)null;
        var safehouseBaseline = snapshots.Count > 0
            ? snapshots.Average(s => s.ProgressPercent)
            : (decimal?)null;

        decimal? slope = null;
        if (monthlyAverages.Count > 1)
        {
            slope = (monthlyAverages[^1].Avg - monthlyAverages[0].Avg) / (monthlyAverages.Count - 1);
            slope = Math.Round(slope.Value, 4);
        }

        var baseline = safehouseBaseline ?? globalBaseline;
        var predictedNext = PredictNextFromHistory(monthlyAverages.Select(x => x.Avg).ToList(), baseline);

        var alertFlag = false;
        var alertReason = "None";
        if (monthlyAverages.Count < 2)
        {
            alertFlag = true;
            alertReason = "Insufficient history";
        }
        else if (predictedNext < 55m)
        {
            alertFlag = true;
            alertReason = "Low projected score";
        }
        else if (slope <= -4m)
        {
            alertFlag = true;
            alertReason = "Declining trajectory";
        }

        var nextMonthDate = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        nextMonthDate = new DateOnly(nextMonthDate.Year, nextMonthDate.Month, 1).AddMonths(1);

        var existing = await db.SafehouseEducationForecasts
            .FirstOrDefaultAsync(x => x.SafehouseId == safehouseId, cancellationToken);

        if (existing == null)
        {
            existing = new SafehouseEducationForecast
            {
                SafehouseId = safehouseId
            };
            db.SafehouseEducationForecasts.Add(existing);
        }

        existing.ForecastForMonth = nextMonthDate;
        existing.PredictedEducationScore = predictedNext;
        existing.LatestObservedScore = Math.Round(Math.Clamp(latestObserved, 0m, 100m), 2);
        existing.PreviousObservedScore = previousObserved is null ? null : Math.Round(Math.Clamp(previousObserved.Value, 0m, 100m), 2);
        existing.TrajectorySlope = slope;
        existing.HistoryMonthsUsed = monthlyAverages.Count;
        existing.AlertFlag = alertFlag;
        existing.AlertReason = alertReason;
        existing.ScoredAtUtc = DateTime.UtcNow;
        existing.ModelVersion = ModelVersion;
    }

    private static decimal PredictNextFromHistory(IReadOnlyList<decimal> history, decimal baseline)
    {
        var rawProjected = history.Count switch
        {
            >= 2 => history[^1] + ((history[^1] - history[0]) / (history.Count - 1) * 0.6m),
            1 => history[^1],
            _ => baseline
        };

        var predicted = (rawProjected * 0.65m) + (baseline * 0.35m);
        return Math.Round(Math.Clamp(predicted, 5m, 95m), 2);
    }

    private static async Task<decimal> LoadGlobalBaselineAsync(HopeHarborContext db, CancellationToken cancellationToken)
    {
        var globalProgressRows = await db.EducationRecords
            .AsNoTracking()
            .Where(e => e.ProgressPercent != null)
            .Select(e => e.ProgressPercent!.Value)
            .ToListAsync(cancellationToken);

        var globalBaseline = globalProgressRows.Count > 0 ? globalProgressRows.Average() : 75m;
        return Math.Clamp(globalBaseline, 0m, 100m);
    }
}
