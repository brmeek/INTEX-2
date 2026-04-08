using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("social_media_conversion_predictions")]
public class SocialMediaConversionPrediction
{
    [Key]
    [Column("prediction_id")]
    public int PredictionId { get; set; }

    [Column("platform")]
    [MaxLength(50)]
    public string Platform { get; set; } = "Facebook";

    [Column("post_type")]
    [MaxLength(50)]
    public string PostType { get; set; } = "Impact Story";

    [Column("media_type")]
    [MaxLength(50)]
    public string MediaType { get; set; } = "Image";

    [Column("sentiment_tone")]
    [MaxLength(50)]
    public string SentimentTone { get; set; } = "Hopeful";

    [Column("content_topic")]
    [MaxLength(100)]
    public string ContentTopic { get; set; } = "Program Impact";

    [Column("has_call_to_action")]
    public bool HasCallToAction { get; set; }

    [Column("call_to_action_type")]
    [MaxLength(100)]
    public string? CallToActionType { get; set; }

    [Column("is_boosted")]
    public bool IsBoosted { get; set; }

    [Column("boost_budget_php")]
    public decimal BoostBudgetPhp { get; set; }

    [Column("num_hashtags")]
    public int NumHashtags { get; set; }

    [Column("caption_length")]
    public int CaptionLength { get; set; }

    [Column("features_resident_story")]
    public bool FeaturesResidentStory { get; set; }

    [Column("campaign_name")]
    [MaxLength(255)]
    public string? CampaignName { get; set; }

    [Column("predicted_log_referrals")]
    public decimal PredictedLogReferrals { get; set; }

    [Column("predicted_referrals")]
    public decimal PredictedReferrals { get; set; }

    [Column("prediction_confidence")]
    [MaxLength(20)]
    public string PredictionConfidence { get; set; } = "Medium";

    [Column("model_version")]
    [MaxLength(100)]
    public string ModelVersion { get; set; } = "social-media-conversion-v1";

    [Column("scored_at_utc")]
    public DateTime ScoredAtUtc { get; set; }
}
