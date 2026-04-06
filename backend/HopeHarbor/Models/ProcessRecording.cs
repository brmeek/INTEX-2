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
    [MaxLength(100)]
    public string? SocialWorker { get; set; }

    [Column("session_type")]
    [MaxLength(50)]
    public string? SessionType { get; set; }

    [Column("emotional_state")]
    [MaxLength(100)]
    public string? EmotionalState { get; set; }

    [Column("narrative_summary")]
    public string? NarrativeSummary { get; set; }

    [Column("interventions_applied")]
    public string? InterventionsApplied { get; set; }

    [Column("follow_up_actions")]
    public string? FollowUpActions { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }
}
