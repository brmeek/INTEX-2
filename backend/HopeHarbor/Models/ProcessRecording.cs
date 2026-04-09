using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("process_recordings")]
public class ProcessRecording
{
    [Key]
    [Column("recording_id")]
    public int RecordingId { get; set; }

    [Column("resident_id")]
    public int? ResidentId { get; set; }

    [ForeignKey("ResidentId")]
    public Resident? Resident { get; set; }

    [Column("session_date")]
    public DateOnly? SessionDate { get; set; }

    [Column("social_worker")]
    [StringLength(100)]
    public string? SocialWorker { get; set; }

    [Column("session_type")]
    [StringLength(50)]
    public string? SessionType { get; set; }

    [Column("emotional_state_observed")]
    [StringLength(100)]
    public string? EmotionalState { get; set; }

    [Column("session_narrative")]
    [StringLength(2000)]
    public string? NarrativeSummary { get; set; }

    [Column("interventions_applied")]
    [StringLength(2000)]
    public string? InterventionsApplied { get; set; }

    [Column("follow_up_actions")]
    [StringLength(2000)]
    public string? FollowUpActions { get; set; }

    [NotMapped]
    public DateTime? CreatedAt { get; set; }
}
