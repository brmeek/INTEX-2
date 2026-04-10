using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("donor_churn_scores")]
public class DonorChurnScore
{
    [Key]
    [Column("supporter_id")]
    public int SupporterId { get; set; }

    [ForeignKey(nameof(SupporterId))]
    public Supporter? Supporter { get; set; }

    [Column("churn_probability")]
    public decimal ChurnProbability { get; set; }

    [Column("churn_predicted")]
    public bool ChurnPredicted { get; set; }

    [Column("risk_tier")]
    [StringLength(20)]
    public string RiskTier { get; set; } = "Low";

    [Column("scored_at_utc")]
    public DateTime ScoredAtUtc { get; set; }

    [Column("model_version")]
    [StringLength(100)]
    public string ModelVersion { get; set; } = "donor-churn-v1";

    [Column("days_since_last_donation")]
    public int DaysSinceLastDonation { get; set; }

    [Column("has_recurring_donation")]
    public bool HasRecurringDonation { get; set; }

    [Column("num_campaigns_participated")]
    public int NumCampaignsParticipated { get; set; }

    [Column("giving_trajectory")]
    public decimal GivingTrajectory { get; set; }

    [Column("skipped_most_recent_campaign")]
    public bool SkippedMostRecentCampaign { get; set; }
}
