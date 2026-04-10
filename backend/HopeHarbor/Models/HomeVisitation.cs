using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("home_visitations")]
public class HomeVisitation
{
    [Key]
    [Column("visitation_id")]
    public int VisitationId { get; set; }

    [Column("resident_id")]
    public int? ResidentId { get; set; }

    [ForeignKey("ResidentId")]
    public Resident? Resident { get; set; }

    [Column("visit_date")]
    public DateOnly? VisitDate { get; set; }

    [Column("social_worker")]
    [StringLength(100)]
    public string? SocialWorker { get; set; }

    [Column("visit_type")]
    [StringLength(100)]
    public string? VisitType { get; set; }

    [Column("location_visited")]
    [StringLength(255)]
    public string? LocationVisited { get; set; }

    [Column("family_members_present")]
    [StringLength(2000)]
    public string? FamilyMembersPresent { get; set; }

    [Column("purpose")]
    [StringLength(2000)]
    public string? Purpose { get; set; }

    [Column("observations")]
    [StringLength(2000)]
    public string? Observations { get; set; }

    [Column("family_cooperation_level")]
    [StringLength(100)]
    public string? FamilyCooperationLevel { get; set; }

    [Column("safety_concerns_noted")]
    public bool? SafetyConcernsNoted { get; set; }

    [Column("follow_up_needed")]
    public bool? FollowUpNeeded { get; set; }

    [Column("follow_up_notes")]
    [StringLength(2000)]
    public string? FollowUpNotes { get; set; }

    [Column("visit_outcome")]
    [StringLength(100)]
    public string? VisitOutcome { get; set; }
}
