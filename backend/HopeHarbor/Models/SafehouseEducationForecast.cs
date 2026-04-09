using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("safehouse_education_forecasts")]
public class SafehouseEducationForecast
{
    [Key]
    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [ForeignKey(nameof(SafehouseId))]
    public Safehouse? Safehouse { get; set; }

    [Column("forecast_for_month")]
    public DateOnly ForecastForMonth { get; set; }

    [Column("predicted_education_score")]
    public decimal PredictedEducationScore { get; set; }

    [Column("latest_observed_score")]
    public decimal LatestObservedScore { get; set; }

    [Column("previous_observed_score")]
    public decimal? PreviousObservedScore { get; set; }

    [Column("trajectory_slope")]
    public decimal? TrajectorySlope { get; set; }

    [Column("history_months_used")]
    public int HistoryMonthsUsed { get; set; }

    [Column("alert_flag")]
    public bool AlertFlag { get; set; }

    [Column("alert_reason")]
    [StringLength(120)]
    public string AlertReason { get; set; } = "None";

    [Column("scored_at_utc")]
    public DateTime ScoredAtUtc { get; set; }

    [Column("model_version")]
    [StringLength(100)]
    public string ModelVersion { get; set; } = "safehouse-education-forecast-v1";
}
