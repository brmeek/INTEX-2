using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("regional_risk_snapshots")]
public class RegionalRiskSnapshot
{
    [Key]
    [Column("regional_risk_snapshot_id")]
    public int RegionalRiskSnapshotId { get; set; }

    [Column("region")]
    [MaxLength(100)]
    public string Region { get; set; } = string.Empty;

    [Column("risk_score")]
    public decimal RiskScore { get; set; }

    [Column("source_pipeline")]
    [MaxLength(100)]
    public string? SourcePipeline { get; set; }

    [Column("updated_at_utc")]
    public DateTime UpdatedAtUtc { get; set; }
}
