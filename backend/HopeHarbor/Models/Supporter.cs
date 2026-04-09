using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("supporters")]
public class Supporter
{
    [Key]
    [Column("supporter_id")]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int SupporterId { get; set; }

    [Column("display_name")]
    [MaxLength(255)]
    public string? SupporterName { get; set; }

    [Column("supporter_type")]
    [MaxLength(100)]
    public string? SupporterType { get; set; }

    [Column("organization_name")]
    [MaxLength(255)]
    public string? OrganizationName { get; set; }

    [Column("first_name")]
    [MaxLength(100)]
    public string? FirstName { get; set; }

    [Column("last_name")]
    [MaxLength(100)]
    public string? LastName { get; set; }

    [Column("relationship_type")]
    [MaxLength(100)]
    public string? RelationshipType { get; set; }

    [Column("email")]
    [MaxLength(255)]
    public string? Email { get; set; }

    [Column("phone")]
    [MaxLength(50)]
    public string? Phone { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string? Status { get; set; }

    [Column("first_donation_date")]
    public DateOnly? FirstGiftDate { get; set; }

    [NotMapped]
    public DateOnly? LastGiftDate { get; set; }

    [NotMapped]
    public decimal? TotalGiven { get; set; }

    [Column("region")]
    [MaxLength(100)]
    public string? Region { get; set; }

    [Column("country")]
    [MaxLength(100)]
    public string? Country { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [Column("acquisition_channel")]
    [MaxLength(100)]
    public string? AcquisitionChannel { get; set; }

    [NotMapped]
    public string? Notes { get; set; }

    public ICollection<Donation>? Donations { get; set; }
}
