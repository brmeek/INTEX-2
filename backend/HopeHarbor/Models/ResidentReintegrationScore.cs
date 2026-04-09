using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("resident_reintegration_scores")]
public class ResidentReintegrationScore
{
    [Key]
    [Column("resident_id")]
    public int ResidentId { get; set; }

    [ForeignKey(nameof(ResidentId))]
    public Resident? Resident { get; set; }

    [Column("readiness_score")]
    public decimal ReadinessScore { get; set; }

    [Column("readiness_tier")]
    [StringLength(40)]
    public string ReadinessTier { get; set; } = "Needs Monitoring";

    [Column("top_concern_feature")]
    [StringLength(100)]
    public string TopConcernFeature { get; set; } = "none";

    [Column("trend_label")]
    [StringLength(40)]
    public string TrendLabel { get; set; } = "Insufficient History";

    [Column("history_months_used")]
    public int HistoryMonthsUsed { get; set; }

    [Column("month_over_month_change")]
    public decimal? MonthOverMonthChange { get; set; }

    [Column("first_vs_latest_change")]
    public decimal? FirstVsLatestChange { get; set; }

    [Column("initial_vs_latest_change")]
    public decimal? InitialVsLatestChange { get; set; }

    [Column("trajectory_slope")]
    public decimal? TrajectorySlope { get; set; }

    [Column("scored_at_utc")]
    public DateTime ScoredAtUtc { get; set; }

    [Column("model_version")]
    [StringLength(100)]
    public string ModelVersion { get; set; } = "reintegration-readiness-v1";
}
