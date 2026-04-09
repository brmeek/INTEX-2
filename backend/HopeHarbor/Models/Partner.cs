using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("partners")]
public class Partner
{
    [Key]
    [Column("partner_id")]
    public int PartnerId { get; set; }

    [Column("partner_name")]
    [StringLength(255)]
    public string? PartnerName { get; set; }

    [Column("partner_type")]
    [StringLength(100)]
    public string? PartnerType { get; set; }

    [Column("role_type")]
    [StringLength(100)]
    public string? RoleType { get; set; }

    [Column("contact_name")]
    [StringLength(255)]
    public string? ContactName { get; set; }

    [Column("email")]
    [StringLength(255)]
    public string? Email { get; set; }

    [Column("phone")]
    [StringLength(50)]
    public string? Phone { get; set; }

    [Column("region")]
    [StringLength(100)]
    public string? Region { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("start_date")]
    public DateOnly? StartDate { get; set; }

    [Column("end_date")]
    public DateOnly? EndDate { get; set; }

    [Column("notes")]
    [StringLength(2000)]
    public string? Notes { get; set; }

    public ICollection<PartnerAssignment>? Assignments { get; set; }
}
