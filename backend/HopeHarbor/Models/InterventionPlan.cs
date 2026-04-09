using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("intervention_plans")]
public class InterventionPlan
{
    [Key]
    [Column("plan_id")]
    public int PlanId { get; set; }

    [Column("resident_id")]
    public int? ResidentId { get; set; }

    [ForeignKey("ResidentId")]
    public Resident? Resident { get; set; }

    [Column("plan_category")]
    [StringLength(100)]
    public string? PlanCategory { get; set; }

    [Column("plan_description")]
    [StringLength(2000)]
    public string? PlanDescription { get; set; }

    [Column("services_provided")]
    [StringLength(2000)]
    public string? ServicesProvided { get; set; }

    [Column("target_value")]
    public decimal? TargetValue { get; set; }

    [Column("target_date")]
    public DateOnly? TargetDate { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("case_conference_date")]
    public DateOnly? CaseConferenceDate { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("updated_at")]
    public DateTime? UpdatedAt { get; set; }
}
