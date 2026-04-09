using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("partner_assignments")]
public class PartnerAssignment
{
    [Key]
    [Column("assignment_id")]
    public int AssignmentId { get; set; }

    [Column("partner_id")]
    public int? PartnerId { get; set; }

    [ForeignKey("PartnerId")]
    public Partner? Partner { get; set; }

    [Column("safehouse_id")]
    public int? SafehouseId { get; set; }

    [Column("program_area")]
    [StringLength(100)]
    public string? ProgramArea { get; set; }

    [Column("assignment_start")]
    public DateOnly? AssignmentStart { get; set; }

    [Column("assignment_end")]
    public DateOnly? AssignmentEnd { get; set; }

    [Column("responsibility_notes")]
    [StringLength(2000)]
    public string? ResponsibilityNotes { get; set; }

    [Column("is_primary")]
    public bool? IsPrimary { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }
}
