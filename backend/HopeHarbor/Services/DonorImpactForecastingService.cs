using HopeHarbor.Data;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Services;

public interface IDonorImpactForecastingService
{
    Task<DonorImpactForecastResult> ForecastAsync(HopeHarborContext db, DonorImpactForecastInput input, CancellationToken cancellationToken = default);
}

public sealed class DonorImpactForecastInput
{
    public decimal Amount { get; set; }
    public bool IsRecurring { get; set; }
    public string? ChannelSource { get; set; }
    public string? CampaignName { get; set; }
    public string? CurrencyCode { get; set; }
}

public sealed class DonorImpactForecastResult
{
    public decimal EstimatedResidentsSupportedThisMonth { get; set; }
    public decimal EducationAmount { get; set; }
    public decimal WellbeingAmount { get; set; }
    public decimal OperationsAmount { get; set; }
    public decimal OutreachAmount { get; set; }
    public string TopArea { get; set; } = "operations";
    public string ImpactMessage { get; set; } = string.Empty;
    public string ModelVersion { get; set; } = "donor-impact-allocation-v1";
}

public sealed class DonorImpactForecastingService : IDonorImpactForecastingService
{
    private const string ModelVersion = "donor-impact-allocation-v1";

    public async Task<DonorImpactForecastResult> ForecastAsync(HopeHarborContext db, DonorImpactForecastInput input, CancellationToken cancellationToken = default)
    {
        var amount = Math.Round(Math.Clamp(input.Amount, 1m, 1_000_000m), 2);

        var baselineShares = await GetBaselineSharesAsync(db, cancellationToken);
        var adjusted = ApplyHeuristics(baselineShares, input);

        var total = adjusted.Education + adjusted.Wellbeing + adjusted.Operations + adjusted.Outreach;
        if (total <= 0m)
        {
            adjusted = (0.28m, 0.26m, 0.34m, 0.12m);
            total = 1m;
        }

        var educationShare = adjusted.Education / total;
        var wellbeingShare = adjusted.Wellbeing / total;
        var operationsShare = adjusted.Operations / total;
        var outreachShare = adjusted.Outreach / total;

        var educationAmount = Math.Round(amount * educationShare, 2);
        var wellbeingAmount = Math.Round(amount * wellbeingShare, 2);
        var operationsAmount = Math.Round(amount * operationsShare, 2);
        var outreachAmount = Math.Round(amount * outreachShare, 2);

        // Ensure tiny rounding drift is corrected into the largest bucket.
        var roundingDiff = amount - (educationAmount + wellbeingAmount + operationsAmount + outreachAmount);
        if (roundingDiff != 0m)
        {
            var shares = new Dictionary<string, decimal>
            {
                ["education"] = educationAmount,
                ["wellbeing"] = wellbeingAmount,
                ["operations"] = operationsAmount,
                ["outreach"] = outreachAmount
            };
            var top = shares.OrderByDescending(kv => kv.Value).First().Key;
            switch (top)
            {
                case "education":
                    educationAmount += roundingDiff;
                    break;
                case "wellbeing":
                    wellbeingAmount += roundingDiff;
                    break;
                case "operations":
                    operationsAmount += roundingDiff;
                    break;
                default:
                    outreachAmount += roundingDiff;
                    break;
            }
        }

        var amountForImpactPhp = ConvertToPhp(amount, input.CurrencyCode);
        var phpPerResident = await EstimatePhpPerResidentAsync(db, cancellationToken);
        var residentsSupported = phpPerResident > 0m
            ? Math.Round(amountForImpactPhp / phpPerResident, 2)
            : 0m;

        var topArea = new Dictionary<string, decimal>
        {
            ["education"] = educationAmount,
            ["wellbeing"] = wellbeingAmount,
            ["operations"] = operationsAmount,
            ["outreach"] = outreachAmount
        }.OrderByDescending(kv => kv.Value).First().Key;

        return new DonorImpactForecastResult
        {
            EstimatedResidentsSupportedThisMonth = residentsSupported,
            EducationAmount = educationAmount,
            WellbeingAmount = wellbeingAmount,
            OperationsAmount = operationsAmount,
            OutreachAmount = outreachAmount,
            TopArea = topArea,
            ImpactMessage = $"Based on historical allocation patterns, this donation is most likely to support {DescribeArea(topArea)}.",
            ModelVersion = ModelVersion
        };
    }

    private static (decimal Education, decimal Wellbeing, decimal Operations, decimal Outreach) ApplyHeuristics(
        (decimal Education, decimal Wellbeing, decimal Operations, decimal Outreach) shares,
        DonorImpactForecastInput input)
    {
        var education = shares.Education;
        var wellbeing = shares.Wellbeing;
        var operations = shares.Operations;
        var outreach = shares.Outreach;

        var channel = (input.ChannelSource ?? string.Empty).Trim().ToLowerInvariant();
        var campaign = (input.CampaignName ?? string.Empty).Trim().ToLowerInvariant();

        if (input.IsRecurring)
        {
            operations += 0.02m;
            wellbeing += 0.01m;
            outreach -= 0.01m;
            education -= 0.02m;
        }

        if (campaign.Contains("school") || campaign.Contains("education"))
        {
            education += 0.05m;
            operations -= 0.02m;
            wellbeing -= 0.02m;
            outreach -= 0.01m;
        }
        else if (campaign.Contains("health") || campaign.Contains("well"))
        {
            wellbeing += 0.05m;
            education -= 0.02m;
            operations -= 0.02m;
            outreach -= 0.01m;
        }
        else if (campaign.Contains("outreach") || campaign.Contains("community"))
        {
            outreach += 0.05m;
            education -= 0.02m;
            wellbeing -= 0.01m;
            operations -= 0.02m;
        }

        if (channel.Contains("social"))
        {
            outreach += 0.03m;
            operations -= 0.02m;
            education -= 0.01m;
        }
        else if (channel.Contains("portal"))
        {
            operations += 0.02m;
            wellbeing += 0.01m;
            outreach -= 0.03m;
        }

        education = Math.Max(0.05m, education);
        wellbeing = Math.Max(0.05m, wellbeing);
        operations = Math.Max(0.05m, operations);
        outreach = Math.Max(0.05m, outreach);

        return (education, wellbeing, operations, outreach);
    }

    private static string DescribeArea(string area) => area switch
    {
        "education" => "education support (schooling, tutoring, and learning resources)",
        "wellbeing" => "health and wellbeing services",
        "outreach" => "community outreach and awareness",
        _ => "safehouse operations and daily essentials"
    };

    private static decimal ConvertToPhp(decimal amount, string? currencyCode)
    {
        var currency = (currencyCode ?? "USD").Trim().ToUpperInvariant();
        var fxRateToPhp = currency switch
        {
            "PHP" => 1.00m,
            "USD" => 56.00m,
            "AUD" => 37.00m,
            "EUR" => 60.00m,
            "GBP" => 70.00m,
            _ => 56.00m
        };

        return Math.Round(amount * fxRateToPhp, 2);
    }

    private static async Task<(decimal Education, decimal Wellbeing, decimal Operations, decimal Outreach)> GetBaselineSharesAsync(
        HopeHarborContext db,
        CancellationToken cancellationToken)
    {
        var allocations = await db.DonationAllocations
            .AsNoTracking()
            .Where(a => a.AmountAllocated.HasValue && a.AmountAllocated.Value > 0m)
            .Select(a => new { a.ProgramArea, Amount = a.AmountAllocated ?? 0m })
            .ToListAsync(cancellationToken);

        if (allocations.Count == 0)
            return (0.28m, 0.26m, 0.34m, 0.12m);

        decimal education = 0m;
        decimal wellbeing = 0m;
        decimal operations = 0m;
        decimal outreach = 0m;

        foreach (var item in allocations)
        {
            var area = (item.ProgramArea ?? string.Empty).Trim().ToLowerInvariant();
            if (area.Contains("educ"))
                education += item.Amount;
            else if (area.Contains("well") || area.Contains("health"))
                wellbeing += item.Amount;
            else if (area.Contains("outreach") || area.Contains("community"))
                outreach += item.Amount;
            else
                operations += item.Amount;
        }

        var total = education + wellbeing + operations + outreach;
        if (total <= 0m)
            return (0.28m, 0.26m, 0.34m, 0.12m);

        return (education / total, wellbeing / total, operations / total, outreach / total);
    }

    private static async Task<decimal> EstimatePhpPerResidentAsync(HopeHarborContext db, CancellationToken cancellationToken)
    {
        var activeResidents = await db.Residents
            .AsNoTracking()
            .CountAsync(r =>
                r.AdmissionDate.HasValue
                && (!r.ReintegrationDate.HasValue || r.ReintegrationDate.Value >= DateOnly.FromDateTime(DateTime.UtcNow.Date)),
                cancellationToken);

        var recentDonationTotals = await db.Donations
            .AsNoTracking()
            .Where(d => d.Amount.HasValue && d.Amount.Value > 0m && d.DonationDate.HasValue)
            .OrderByDescending(d => d.DonationDate)
            .Take(400)
            .Select(d => d.Amount ?? 0m)
            .ToListAsync(cancellationToken);

        if (activeResidents <= 0 || recentDonationTotals.Count == 0)
            return 5_000m;

        var avgDonation = recentDonationTotals.Average();
        var estimatedMonthlyBudget = avgDonation * Math.Max(1m, recentDonationTotals.Count / 12m);
        var phpPerResident = estimatedMonthlyBudget / Math.Max(1, activeResidents);
        return Math.Round(Math.Clamp(phpPerResident, 250m, 25_000m), 2);
    }
}
