using HopeHarbor.Models;

namespace HopeHarbor.Services;

public interface ISocialMediaConversionScoringService
{
    string ModelVersion { get; }
    SocialMediaConversionPrediction ScoreDraft(SocialMediaDraftInput input);
}

public sealed class SocialMediaDraftInput
{
    public string Platform { get; set; } = "Facebook";
    public string PostType { get; set; } = "Impact Story";
    public string MediaType { get; set; } = "Image";
    public string SentimentTone { get; set; } = "Hopeful";
    public string ContentTopic { get; set; } = "Program Impact";
    public bool HasCallToAction { get; set; }
    public string? CallToActionType { get; set; }
    public bool IsBoosted { get; set; }
    public decimal BoostBudgetPhp { get; set; }
    public int NumHashtags { get; set; }
    public int CaptionLength { get; set; }
    public bool FeaturesResidentStory { get; set; }
    public string? CampaignName { get; set; }
}

public sealed class SocialMediaConversionScoringService : ISocialMediaConversionScoringService
{
    private const string DefaultModelVersion = "social-media-conversion-v1";

    public string ModelVersion { get; }

    public SocialMediaConversionScoringService(IConfiguration configuration)
    {
        ModelVersion = ResolveModelVersion(
            configuration,
            envKey: "MODEL_VERSION_SOCIAL_MEDIA_CONVERSION",
            configKey: "ModelVersions:SocialMediaConversion",
            fallback: DefaultModelVersion);
    }

    public SocialMediaConversionPrediction ScoreDraft(SocialMediaDraftInput input)
    {
        var baseScore = 1.35m;

        baseScore += input.Platform.ToLowerInvariant() switch
        {
            "facebook" => 0.30m,
            "instagram" => 0.22m,
            "tiktok" => 0.26m,
            "youtube" => 0.18m,
            _ => 0.12m
        };

        baseScore += input.PostType.ToLowerInvariant() switch
        {
            "impact story" => 0.45m,
            "appeal" => 0.35m,
            "campaign update" => 0.22m,
            "event promo" => 0.14m,
            _ => 0.10m
        };

        baseScore += input.MediaType.ToLowerInvariant() switch
        {
            "video" => 0.40m,
            "carousel" => 0.28m,
            "image" => 0.16m,
            _ => 0.08m
        };

        baseScore += input.SentimentTone.ToLowerInvariant() switch
        {
            "hopeful" => 0.22m,
            "urgent" => 0.25m,
            "celebratory" => 0.15m,
            _ => 0.10m
        };

        baseScore += input.ContentTopic.ToLowerInvariant() switch
        {
            "program impact" => 0.36m,
            "resident story" => 0.41m,
            "funding need" => 0.29m,
            "event" => 0.13m,
            _ => 0.10m
        };

        if (input.FeaturesResidentStory) baseScore += 0.28m;
        if (input.HasCallToAction) baseScore += 0.32m;

        if (!string.IsNullOrWhiteSpace(input.CallToActionType))
        {
            baseScore += input.CallToActionType.Trim().ToLowerInvariant() switch
            {
                "donate now" => 0.26m,
                "learn more" => 0.16m,
                "share" => 0.10m,
                _ => 0.08m
            };
        }

        baseScore += Math.Clamp(input.NumHashtags, 0, 12) * 0.025m;
        baseScore += Math.Clamp(input.CaptionLength, 20, 500) / 500m * 0.35m;

        if (input.IsBoosted)
            baseScore += 0.25m + Math.Clamp(input.BoostBudgetPhp, 0m, 10000m) / 10000m * 0.80m;

        var predLog = Math.Clamp(baseScore, 0m, 5.5m);
        var predictedReferrals = (decimal)Math.Exp((double)predLog) - 1m;
        predictedReferrals = Math.Round(Math.Clamp(predictedReferrals, 0m, 1000m), 2);

        var confidence = predictedReferrals switch
        {
            >= 80m => "High",
            >= 25m => "Medium",
            _ => "Low"
        };

        return new SocialMediaConversionPrediction
        {
            Platform = input.Platform,
            PostType = input.PostType,
            MediaType = input.MediaType,
            SentimentTone = input.SentimentTone,
            ContentTopic = input.ContentTopic,
            HasCallToAction = input.HasCallToAction,
            CallToActionType = input.CallToActionType,
            IsBoosted = input.IsBoosted,
            BoostBudgetPhp = Math.Round(Math.Max(0m, input.BoostBudgetPhp), 2),
            NumHashtags = Math.Clamp(input.NumHashtags, 0, 50),
            CaptionLength = Math.Clamp(input.CaptionLength, 0, 2000),
            FeaturesResidentStory = input.FeaturesResidentStory,
            CampaignName = input.CampaignName,
            PredictedLogReferrals = Math.Round(predLog, 4),
            PredictedReferrals = predictedReferrals,
            PredictionConfidence = confidence,
            ModelVersion = ModelVersion,
            ScoredAtUtc = DateTime.UtcNow
        };
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
