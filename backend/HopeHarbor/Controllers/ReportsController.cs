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
public class ReportsController : ControllerBase
{
    private readonly HopeHarborContext _db;
    private readonly ISocialMediaConversionScoringService _socialMediaConversionScoringService;
    private readonly ISafehouseEducationForecastingService _safehouseEducationForecastingService;

    public ReportsController(
        HopeHarborContext db,
        ISocialMediaConversionScoringService socialMediaConversionScoringService,
        ISafehouseEducationForecastingService safehouseEducationForecastingService)
    {
        _db = db;
        _socialMediaConversionScoringService = socialMediaConversionScoringService;
        _safehouseEducationForecastingService = safehouseEducationForecastingService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalResidents = await _db.Residents.CountAsync();
        var totalDonations = await _db.Donations.Where(d => d.Amount != null).SumAsync(d => d.Amount ?? 0);
        var donationCount = await _db.Donations.CountAsync();
        var safehouseCount = await _db.Safehouses.CountAsync();
        var recentDonations = await _db.Donations
            .Include(d => d.Supporter)
            .OrderByDescending(d => d.DonationDate)
            .Take(5)
            .ToListAsync();
        var atRiskDonors = await _db.DonorChurnScores
            .Include(s => s.Supporter)
            .Where(s => s.ChurnPredicted)
            .OrderByDescending(s => s.ChurnProbability)
            .Take(5)
            .Select(s => new
            {
                s.SupporterId,
                supporterName = s.Supporter != null ? s.Supporter.SupporterName : null,
                s.RiskTier,
                s.ChurnProbability,
                s.ScoredAtUtc
            })
            .ToListAsync();
        var upcomingConferences = await _db.InterventionPlans
            .Where(p => p.CaseConferenceDate != null && p.CaseConferenceDate >= DateOnly.FromDateTime(DateTime.Today))
            .OrderBy(p => p.CaseConferenceDate)
            .Take(5)
            .Include(p => p.Resident)
            .ToListAsync();
        var safehouseEducationForecasts = await _db.SafehouseEducationForecasts
            .Include(f => f.Safehouse)
            .OrderByDescending(f => f.AlertFlag)
            .ThenBy(f => f.SafehouseId)
            .Select(f => new
            {
                f.SafehouseId,
                safehouseName = f.Safehouse != null ? f.Safehouse.SafehouseName : null,
                region = f.Safehouse != null ? f.Safehouse.Region : null,
                f.ForecastForMonth,
                f.PredictedEducationScore,
                f.LatestObservedScore,
                f.PreviousObservedScore,
                f.TrajectorySlope,
                f.HistoryMonthsUsed,
                f.AlertFlag,
                f.AlertReason,
                f.ScoredAtUtc
            })
            .ToListAsync();
        var safehouseForecastEvaluation = await _safehouseEducationForecastingService.EvaluateAsync(_db);

        return Ok(new
        {
            activeResidents,
            totalResidents,
            totalDonations,
            donationCount,
            safehouseCount,
            recentDonations,
            atRiskDonors,
            upcomingConferences,
            safehouseEducationForecasts,
            safehouseForecastEvaluation
        });
    }

    [HttpPost("safehouse-education/refresh")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> RefreshSafehouseEducationForecasts(CancellationToken cancellationToken)
    {
        var scoredCount = await _safehouseEducationForecastingService.ScoreAllAsync(_db, cancellationToken);
        return Ok(new
        {
            message = "Safehouse education forecasts refreshed.",
            scoredCount
        });
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var trends = await _db.Donations
            .Where(d => d.DonationDate != null && d.Amount != null)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(d => d.Amount ?? 0),
                Count = g.Count()
            })
            .OrderBy(t => t.Year).ThenBy(t => t.Month)
            .ToListAsync();

        return Ok(trends);
    }

    [HttpGet("impact")]
    [AllowAnonymous]
    public async Task<IActionResult> Impact()
    {
        var currentYear = DateTime.Today.Year;
        var totalResidents = await _db.Residents.CountAsync();
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var reintegrated = await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed");
        var safehouseCount = await _db.Safehouses.CountAsync();
        var totalDonations = await _db.Donations.Where(d => d.Amount != null).SumAsync(d => d.Amount ?? 0);
        var totalRaisedThisYear = await _db.Donations
            .Where(d => d.Amount != null && d.DonationDate != null && d.DonationDate.Value.Year == currentYear)
            .SumAsync(d => d.Amount ?? 0);
        var donorCount = await _db.Supporters.CountAsync();
        var today = DateOnly.FromDateTime(DateTime.Today);
        var activeProgramRegions = await (
            from assignment in _db.PartnerAssignments
            join safehouse in _db.Safehouses on assignment.SafehouseId equals safehouse.SafehouseId
            where assignment.SafehouseId != null
                && !string.IsNullOrWhiteSpace(safehouse.Region)
            select new
            {
                safehouse.Region,
                assignment.Status,
                assignment.AssignmentStart,
                assignment.AssignmentEnd
            })
            .ToListAsync();
        var activeRegionCount = activeProgramRegions
            .Where(a =>
                !string.IsNullOrWhiteSpace(a.Status)
                && a.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                && (a.AssignmentStart == null || a.AssignmentStart <= today)
                && (a.AssignmentEnd == null || a.AssignmentEnd >= today))
            .Select(a => a.Region!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var donationAllocationRows = await _db.DonationAllocations
            .Where(a => a.AmountAllocated != null && !string.IsNullOrWhiteSpace(a.ProgramArea))
            .Select(a => new { a.ProgramArea, a.AmountAllocated })
            .ToListAsync();

        var allocationsByProgramArea = donationAllocationRows
            .GroupBy(a => a.ProgramArea!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new
            {
                programArea = g.Key,
                amountAllocated = g.Sum(a => a.AmountAllocated ?? 0)
            })
            .OrderByDescending(a => a.amountAllocated)
            .ToList();

        // Compute latest-per-resident averages in memory to avoid provider translation edge cases.
        var educationProgressRows = await _db.EducationRecords
            .Where(e => e.ProgressPercent != null)
            .Select(e => new { e.ResidentId, e.RecordDate, e.ProgressPercent })
            .ToListAsync();

        var educationProgress = educationProgressRows
            .Where(e => e.ResidentId != null)
            .GroupBy(e => e.ResidentId)
            .Select(g => g.OrderByDescending(e => e.RecordDate).First().ProgressPercent ?? 0)
            .Select(v => (double)v)
            .DefaultIfEmpty(0)
            .Average();

        var healthScoreRows = await _db.HealthWellbeingRecords
            .Where(h => h.GeneralHealthScore != null)
            .Select(h => new { h.ResidentId, h.RecordDate, h.GeneralHealthScore })
            .ToListAsync();

        var healthScores = healthScoreRows
            .Where(h => h.ResidentId != null)
            .GroupBy(h => h.ResidentId)
            .Select(g => g.OrderByDescending(h => h.RecordDate).First().GeneralHealthScore ?? 0)
            .Select(v => (double)v)
            .DefaultIfEmpty(0)
            .Average();

        var donationsByType = await _db.Donations
            .GroupBy(d => d.DonationType)
            .Select(g => new { Type = g.Key, Count = g.Count(), Total = g.Sum(d => d.EstimatedValue ?? 0) })
            .ToListAsync();

        var donationsByMonth = await _db.Donations
            .Where(d => d.DonationDate != null)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Total = g.Sum(d => d.EstimatedValue ?? 0), Count = g.Count() })
            .OrderBy(t => t.Year).ThenBy(t => t.Month)
            .ToListAsync();

        return Ok(new
        {
            totalResidents,
            activeResidents,
            reintegrated,
            safehouseCount,
            totalDonations,
            totalRaisedThisYear,
            donorCount,
            activeRegionCount,
            allocationsByProgramArea,
            avgEducationProgress = Math.Round(educationProgress, 1),
            avgHealthScore = Math.Round(healthScores, 1),
            donationsByType,
            donationsByMonth
        });
    }

    [HttpGet("safehouse-performance")]
    public async Task<IActionResult> SafehousePerformance()
    {
        var safehouses = await _db.Safehouses
            .Select(s => new
            {
                s.SafehouseId,
                s.SafehouseName,
                s.Region,
                s.Capacity,
                ResidentCount = s.Residents!.Count(),
                ActiveResidents = s.Residents!.Count(r => r.CaseStatus == "Active"),
            })
            .ToListAsync();

        return Ok(safehouses);
    }

    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var byStatus = await _db.Residents
            .GroupBy(r => r.CaseStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var byCategory = await _db.Residents
            .GroupBy(r => r.CaseCategory)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToListAsync();

        var reintegrationRate = await _db.Residents.CountAsync() > 0
            ? Math.Round(100.0 * await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed") / await _db.Residents.CountAsync(), 1)
            : 0;

        return Ok(new { byStatus, byCategory, reintegrationRate });
    }

    [HttpPost("social-media-conversion/predict")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PredictSocialMediaConversion([FromBody] SocialMediaDraftInput input)
    {
        var prediction = _socialMediaConversionScoringService.ScoreDraft(input);
        _db.SocialMediaConversionPredictions.Add(prediction);
        await _db.SaveChangesAsync();

        var avgDonation = await GetAverageDonationPerReferralAsync();

        var predictedDonationValuePhp = Math.Round(
            prediction.PredictedReferrals * avgDonation, 2);
        var planningEstimateLowPhp = Math.Round(predictedDonationValuePhp * 0.75m, 2);
        var planningEstimateHighPhp = Math.Round(predictedDonationValuePhp * 1.25m, 2);

        return Ok(new
        {
            prediction.PredictionId,
            prediction.PredictedLogReferrals,
            prediction.PredictedReferrals,
            referralMetricDefinition = "Estimated number of donors referred by this post (not website visits).",
            predictedDonationValuePhp,
            planningEstimateLowPhp,
            planningEstimateHighPhp,
            averageDonationPerReferralPhp = Math.Round(avgDonation, 2),
            prediction.PredictionConfidence,
            prediction.ModelVersion,
            prediction.ScoredAtUtc
        });
    }

    [HttpGet("posting-calendar/suggestions")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PostingCalendarSuggestions()
    {
        string[] platforms = ["Facebook", "Instagram", "TikTok", "YouTube"];
        string[] postTypes = ["Impact Story", "Appeal", "Campaign Update", "Event Promo"];
        string[] mediaTypes = ["Video", "Carousel", "Image"];
        string[] sentimentTones = ["Hopeful", "Urgent", "Celebratory"];
        string[] contentTopics = ["Program Impact", "Resident Story", "Funding Need", "Event"];
        string[] ctaTypes = ["Donate Now", "Learn More", "Share"];

        var candidates = new List<(SocialMediaDraftInput Input, SocialMediaConversionPrediction Pred)>();

        foreach (var platform in platforms)
        foreach (var postType in postTypes)
        foreach (var mediaType in mediaTypes)
        {
            var input = new SocialMediaDraftInput
            {
                Platform = platform,
                PostType = postType,
                MediaType = mediaType,
                SentimentTone = sentimentTones[0],
                ContentTopic = contentTopics[0],
                HasCallToAction = true,
                CallToActionType = ctaTypes[0],
                NumHashtags = 5,
                CaptionLength = 200,
                FeaturesResidentStory = postType == "Impact Story",
            };
            candidates.Add((input, _socialMediaConversionScoringService.ScoreDraft(input)));
        }

        foreach (var topic in contentTopics)
        foreach (var tone in sentimentTones)
        {
            var input = new SocialMediaDraftInput
            {
                Platform = "Facebook",
                PostType = "Impact Story",
                MediaType = "Video",
                SentimentTone = tone,
                ContentTopic = topic,
                HasCallToAction = true,
                CallToActionType = "Donate Now",
                NumHashtags = 5,
                CaptionLength = 250,
                FeaturesResidentStory = topic == "Resident Story",
            };
            candidates.Add((input, _socialMediaConversionScoringService.ScoreDraft(input)));
        }

        var ranked = candidates
            .OrderByDescending(c => c.Pred.PredictedReferrals)
            .DistinctBy(c => c.Input.Platform + "|" + c.Input.PostType + "|" + c.Input.MediaType)
            .Take(21)
            .ToList();

        var avgDonation = await GetAverageDonationPerReferralAsync();

        var today = DateTime.Today;
        var monday = today.AddDays(-(int)today.DayOfWeek + (int)DayOfWeek.Monday);
        if (monday < today) monday = monday.AddDays(7);

        string[] bestHours = ["09:00", "12:00", "18:00"];

        var suggestions = ranked.Select((c, i) =>
        {
            var dayOffset = i % 7;
            var slotDate = monday.AddDays(dayOffset);
            var bestHour = bestHours[i % bestHours.Length];
            var estDonation = Math.Round(c.Pred.PredictedReferrals * avgDonation, 2);

            return new
            {
                day = slotDate.ToString("yyyy-MM-dd"),
                dayOfWeek = slotDate.DayOfWeek.ToString(),
                suggestedTime = bestHour,
                platform = c.Input.Platform,
                postType = c.Input.PostType,
                mediaType = c.Input.MediaType,
                sentimentTone = c.Input.SentimentTone,
                contentTopic = c.Input.ContentTopic,
                callToActionType = c.Input.CallToActionType,
                featuresResidentStory = c.Input.FeaturesResidentStory,
                predictedReferrals = c.Pred.PredictedReferrals,
                predictedDonationValuePhp = estDonation,
                confidence = c.Pred.PredictionConfidence,
            };
        }).ToList();

        return Ok(new { weekStarting = monday.ToString("yyyy-MM-dd"), suggestions });
    }

    [HttpGet("posting-calendar/history")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> PostingCalendarHistory()
    {
        var predictions = await _db.SocialMediaConversionPredictions
            .OrderByDescending(p => p.ScoredAtUtc)
            .Take(50)
            .ToListAsync();

        var avgDonation = await GetAverageDonationPerReferralAsync();

        var history = predictions.Select(p => new
        {
            p.PredictionId,
            p.Platform,
            p.PostType,
            p.MediaType,
            p.SentimentTone,
            p.ContentTopic,
            p.HasCallToAction,
            p.CallToActionType,
            p.IsBoosted,
            p.BoostBudgetPhp,
            p.FeaturesResidentStory,
            p.CampaignName,
            p.PredictedReferrals,
            predictedDonationValuePhp = Math.Round(p.PredictedReferrals * avgDonation, 2),
            p.PredictionConfidence,
            p.ScoredAtUtc,
        });

        var platformBreakdown = predictions
            .GroupBy(p => p.Platform)
            .Select(g => new
            {
                platform = g.Key,
                count = g.Count(),
                avgReferrals = Math.Round(g.Average(p => (double)p.PredictedReferrals), 1),
            })
            .OrderByDescending(x => x.avgReferrals)
            .ToList();

        var postTypeBreakdown = predictions
            .GroupBy(p => p.PostType)
            .Select(g => new
            {
                postType = g.Key,
                count = g.Count(),
                avgReferrals = Math.Round(g.Average(p => (double)p.PredictedReferrals), 1),
            })
            .OrderByDescending(x => x.avgReferrals)
            .ToList();

        var mediaTypeBreakdown = predictions
            .GroupBy(p => p.MediaType)
            .Select(g => new
            {
                mediaType = g.Key,
                count = g.Count(),
                avgReferrals = Math.Round(g.Average(p => (double)p.PredictedReferrals), 1),
            })
            .OrderByDescending(x => x.avgReferrals)
            .ToList();

        return Ok(new
        {
            history,
            analytics = new { platformBreakdown, postTypeBreakdown, mediaTypeBreakdown }
        });
    }

    private async Task<decimal> GetAverageDonationPerReferralAsync()
    {
        var donationSnapshots = await _db.Donations
            .Where(d => ((d.Amount ?? d.EstimatedValue) ?? 0m) > 0m)
            .Select(d => new
            {
                Value = d.Amount ?? d.EstimatedValue ?? 0m,
                d.ReferralPostId,
                d.ChannelSource
            })
            .ToListAsync();

        var socialAttributedValues = donationSnapshots
            .Where(d =>
                d.ReferralPostId != null
                || (!string.IsNullOrWhiteSpace(d.ChannelSource)
                    && (
                        d.ChannelSource.Contains("social", StringComparison.OrdinalIgnoreCase)
                        || d.ChannelSource.Contains("facebook", StringComparison.OrdinalIgnoreCase)
                        || d.ChannelSource.Contains("instagram", StringComparison.OrdinalIgnoreCase)
                        || d.ChannelSource.Contains("tiktok", StringComparison.OrdinalIgnoreCase)
                        || d.ChannelSource.Contains("youtube", StringComparison.OrdinalIgnoreCase)
                    )))
            .Select(d => d.Value)
            .ToList();

        var overallDonationValues = donationSnapshots
            .Select(d => d.Value)
            .ToList();

        var avg = socialAttributedValues.Count > 0
            ? socialAttributedValues.Average()
            : (overallDonationValues.Count > 0 ? overallDonationValues.Average() : 650m);

        return avg <= 0m ? 650m : avg;
    }
}

