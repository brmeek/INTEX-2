using HopeHarbor.Data;
using HopeHarbor.Models;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Services;

public interface IDonorChurnScoringService
{
    string ModelVersion { get; }
    Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default);
}

public class DonorChurnScoringService : IDonorChurnScoringService
{
    private sealed class DonationSnapshot
    {
        public int SupporterId { get; init; }
        public DateOnly? DonationDate { get; init; }
        public string? DonationType { get; init; }
        public bool? IsRecurring { get; init; }
        public string? CampaignName { get; init; }
        public decimal? Amount { get; init; }
        public decimal? EstimatedValue { get; init; }
    }

    private const decimal PredictionThreshold = 0.35m;
    private const string DefaultModelVersion = "donor-churn-v1";

    public string ModelVersion { get; }

    public DonorChurnScoringService(IConfiguration configuration)
    {
        ModelVersion = ResolveModelVersion(
            configuration,
            envKey: "MODEL_VERSION_DONOR_CHURN",
            configKey: "ModelVersions:DonorChurn",
            fallback: DefaultModelVersion);
    }

    public async Task<int> ScoreAllAsync(HopeHarborContext db, CancellationToken cancellationToken = default)
    {
        var supporters = await db.Supporters
            .AsNoTracking()
            .Select(s => new { s.SupporterId })
            .ToListAsync(cancellationToken);

        var donations = await db.Donations
            .AsNoTracking()
            .Where(d => d.SupporterId != null)
            .Select(d => new DonationSnapshot
            {
                SupporterId = d.SupporterId!.Value,
                DonationDate = d.DonationDate,
                DonationType = d.DonationType,
                IsRecurring = d.IsRecurring,
                CampaignName = d.CampaignName,
                Amount = d.Amount,
                EstimatedValue = d.EstimatedValue
            })
            .ToListAsync(cancellationToken);

        var nowDate = DateOnly.FromDateTime(DateTime.UtcNow.Date);
        var mostRecentCampaign = donations
            .Where(d => d.DonationDate != null && !string.IsNullOrWhiteSpace(d.CampaignName))
            .OrderByDescending(d => d.DonationDate)
            .Select(d => d.CampaignName)
            .FirstOrDefault();

        var donationsBySupporter = donations
            .GroupBy(d => d.SupporterId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var existingScores = await db.DonorChurnScores
            .ToDictionaryAsync(s => s.SupporterId, cancellationToken);

        var scoredAt = DateTime.UtcNow;

        foreach (var supporter in supporters)
        {
            donationsBySupporter.TryGetValue(supporter.SupporterId, out var donorRows);
            donorRows ??= [];

            var lastDonationDate = donorRows
                .Where(d => d.DonationDate != null)
                .OrderByDescending(d => d.DonationDate)
                .Select(d => d.DonationDate)
                .FirstOrDefault();

            var daysSinceLastDonation = lastDonationDate == null
                ? 365
                : Math.Max(0, nowDate.DayNumber - lastDonationDate.Value.DayNumber);

            var hasRecurringDonation = donorRows.Any(d => d.IsRecurring == true);

            var numCampaignsParticipated = donorRows
                .Where(d => !string.IsNullOrWhiteSpace(d.CampaignName))
                .Select(d => d.CampaignName!.Trim().ToLowerInvariant())
                .Distinct()
                .Count();

            var givingTrajectory = CalculateGivingTrajectory(donorRows);

            var skippedMostRecentCampaign = string.IsNullOrWhiteSpace(mostRecentCampaign)
                || !donorRows.Any(d => string.Equals(d.CampaignName, mostRecentCampaign, StringComparison.OrdinalIgnoreCase));

            var probability = CalculateProbability(
                daysSinceLastDonation,
                hasRecurringDonation,
                numCampaignsParticipated,
                givingTrajectory,
                skippedMostRecentCampaign);

            var riskTier = probability >= 0.65m ? "High" : probability >= PredictionThreshold ? "Medium" : "Low";
            var churnPredicted = probability >= PredictionThreshold;

            if (!existingScores.TryGetValue(supporter.SupporterId, out var score))
            {
                score = new DonorChurnScore { SupporterId = supporter.SupporterId };
                db.DonorChurnScores.Add(score);
                existingScores[supporter.SupporterId] = score;
            }

            score.ChurnProbability = probability;
            score.ChurnPredicted = churnPredicted;
            score.RiskTier = riskTier;
            score.ScoredAtUtc = scoredAt;
            score.ModelVersion = ModelVersion;
            score.DaysSinceLastDonation = daysSinceLastDonation;
            score.HasRecurringDonation = hasRecurringDonation;
            score.NumCampaignsParticipated = numCampaignsParticipated;
            score.GivingTrajectory = givingTrajectory;
            score.SkippedMostRecentCampaign = skippedMostRecentCampaign;
        }

        await db.SaveChangesAsync(cancellationToken);
        return supporters.Count;
    }

    private static decimal CalculateGivingTrajectory(IReadOnlyCollection<DonationSnapshot> donorRows)
    {
        var monetaryRows = donorRows
            .Where(d => d.DonationDate != null && string.Equals(d.DonationType, "Monetary", StringComparison.OrdinalIgnoreCase))
            .OrderBy(d => d.DonationDate)
            .ToList();

        if (monetaryRows.Count < 2)
            return 0m;

        var first = Convert.ToDecimal(monetaryRows.First().Amount ?? monetaryRows.First().EstimatedValue ?? 0m);
        var last = Convert.ToDecimal(monetaryRows.Last().Amount ?? monetaryRows.Last().EstimatedValue ?? 0m);
        var baseline = Math.Max(Math.Abs(first), 1m);
        var normalized = (last - first) / baseline;

        return Math.Round(Math.Clamp(normalized, -2m, 2m), 4);
    }

    private static decimal CalculateProbability(
        int daysSinceLastDonation,
        bool hasRecurringDonation,
        int numCampaignsParticipated,
        decimal givingTrajectory,
        bool skippedMostRecentCampaign)
    {
        // This approximates the notebook's feature-direction behavior using the same feature set and thresholds.
        var z = -1.75m
                + (0.018m * daysSinceLastDonation)
                - (hasRecurringDonation ? 0.90m : 0m)
                - (0.25m * numCampaignsParticipated)
                - (0.60m * givingTrajectory)
                + (skippedMostRecentCampaign ? 1.20m : 0m);

        var exp = Math.Exp((double)(-z));
        var probability = 1m / (1m + (decimal)exp);
        return Math.Round(Math.Clamp(probability, 0m, 1m), 4);
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
