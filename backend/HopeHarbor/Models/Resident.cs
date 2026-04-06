using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("residents")]
public class Resident
{
    [Key]
    [Column("resident_id")]
    public int ResidentId { get; set; }

    [Column("first_name")]
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public string? LastName { get; set; }

    [Column("date_of_birth")]
    public DateOnly? DateOfBirth { get; set; }

    [Column("gender")]
    [MaxLength(20)]
    public string? Gender { get; set; }

    [Column("admission_date")]
    public DateOnly? AdmissionDate { get; set; }

    [Column("case_status")]
    [MaxLength(50)]
    public string? CaseStatus { get; set; }

    [Column("case_category")]
    [MaxLength(100)]
    public string? CaseCategory { get; set; }

    [Column("case_subcategory")]
    [MaxLength(100)]
    public string? CaseSubcategory { get; set; }

    [Column("has_disability")]
    public bool? HasDisability { get; set; }

    [Column("disability_details")]
    public string? DisabilityDetails { get; set; }

    [Column("is_4ps_beneficiary")]
    public bool? Is4PsBeneficiary { get; set; }

    [Column("is_solo_parent_child")]
    public bool? IsSoloParentChild { get; set; }

    [Column("is_indigenous")]
    public bool? IsIndigenous { get; set; }

    [Column("is_informal_settler")]
    public bool? IsInformalSettler { get; set; }

    [Column("safehouse_id")]
    public int? SafehouseId { get; set; }

    [ForeignKey("SafehouseId")]
    public Safehouse? Safehouse { get; set; }

    [Column("referral_source")]
    [MaxLength(255)]
    public string? ReferralSource { get; set; }

    [Column("assigned_social_worker")]
    [MaxLength(100)]
    public string? AssignedSocialWorker { get; set; }

    [Column("reintegration_status")]
    [MaxLength(50)]
    public string? ReintegrationStatus { get; set; }

    [Column("reintegration_date")]
    public DateOnly? ReintegrationDate { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    public ICollection<EducationRecord>? EducationRecords { get; set; }
    public ICollection<HealthWellbeingRecord>? HealthRecords { get; set; }
    public ICollection<HomeVisitation>? HomeVisitations { get; set; }
    public ICollection<InterventionPlan>? InterventionPlans { get; set; }
    public ICollection<IncidentReport>? IncidentReports { get; set; }
    public ICollection<ProcessRecording>? ProcessRecordings { get; set; }
}
