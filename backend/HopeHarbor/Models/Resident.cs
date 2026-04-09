using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("residents")]
public class Resident
{
    [Key]
    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("case_control_no")]
    [StringLength(100)]
    public string? FirstName { get; set; }

    [Column("internal_code")]
    [StringLength(100)]
    public string? LastName { get; set; }

    [Column("date_of_birth")]
    public DateOnly? DateOfBirth { get; set; }

    [Column("sex")]
    [StringLength(20)]
    public string? Gender { get; set; }

    [Column("date_of_admission")]
    public DateOnly? AdmissionDate { get; set; }

    [Column("case_status")]
    [StringLength(50)]
    public string? CaseStatus { get; set; }

    [Column("case_category")]
    [StringLength(100)]
    public string? CaseCategory { get; set; }

    [NotMapped]
    [StringLength(100)]
    public string? CaseSubcategory { get; set; }

    [Column("is_pwd")]
    public bool? HasDisability { get; set; }

    [Column("pwd_type")]
    [StringLength(2000)]
    public string? DisabilityDetails { get; set; }

    [Column("family_is_4ps")]
    public bool? Is4PsBeneficiary { get; set; }

    [Column("family_solo_parent")]
    public bool? IsSoloParentChild { get; set; }

    [Column("family_indigenous")]
    public bool? IsIndigenous { get; set; }

    [Column("family_informal_settler")]
    public bool? IsInformalSettler { get; set; }

    [Column("safehouse_id")]
    public int? SafehouseId { get; set; }

    [ForeignKey("SafehouseId")]
    public Safehouse? Safehouse { get; set; }

    [Column("referral_source")]
    [StringLength(255)]
    public string? ReferralSource { get; set; }

    [Column("assigned_social_worker")]
    [StringLength(100)]
    public string? AssignedSocialWorker { get; set; }

    [Column("reintegration_status")]
    [StringLength(50)]
    public string? ReintegrationStatus { get; set; }

    [Column("date_closed")]
    public DateOnly? ReintegrationDate { get; set; }

    [Column("notes_restricted")]
    [StringLength(2000)]
    public string? Notes { get; set; }

    public ICollection<EducationRecord>? EducationRecords { get; set; }
    public ICollection<HealthWellbeingRecord>? HealthRecords { get; set; }
    public ICollection<HomeVisitation>? HomeVisitations { get; set; }
    public ICollection<InterventionPlan>? InterventionPlans { get; set; }
    public ICollection<IncidentReport>? IncidentReports { get; set; }
    public ICollection<ProcessRecording>? ProcessRecordings { get; set; }
}
