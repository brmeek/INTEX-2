using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("pipeline_runs")]
public class PipelineRun
{
    [Key]
    [Column("run_id")]
    public int RunId { get; set; }

    [Column("pipeline_name")]
    [MaxLength(100)]
    public string PipelineName { get; set; } = string.Empty;

    [Column("trigger_source")]
    [MaxLength(50)]
    public string TriggerSource { get; set; } = string.Empty;

    [Column("status")]
    [MaxLength(20)]
    public string Status { get; set; } = "Running";

    [Column("started_at_utc")]
    public DateTime StartedAtUtc { get; set; }

    [Column("finished_at_utc")]
    public DateTime? FinishedAtUtc { get; set; }

    [Column("rows_scored")]
    public int? RowsScored { get; set; }

    [Column("model_version")]
    [MaxLength(100)]
    public string? ModelVersion { get; set; }

    [Column("initiated_by")]
    [MaxLength(255)]
    public string? InitiatedBy { get; set; }

    [Column("error_message")]
    public string? ErrorMessage { get; set; }
}

