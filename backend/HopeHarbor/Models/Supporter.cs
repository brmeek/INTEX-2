using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("supporters")]
public class Supporter
{
    [Key]
    [Column("supporter_id")]
    public int SupporterId { get; set; }

    [Column("supporter_name")]
    [MaxLength(255)]
    public string? SupporterName { get; set; }

    [Column("supporter_type")]
    [MaxLength(100)]
    public string? SupporterType { get; set; }

    [Column("email")]
    [MaxLength(255)]
    public string? Email { get; set; }

    [Column("phone")]
    [MaxLength(50)]
    public string? Phone { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string? Status { get; set; }

    [Column("first_gift_date")]
    public DateOnly? FirstGiftDate { get; set; }

    [Column("last_gift_date")]
    public DateOnly? LastGiftDate { get; set; }

    [Column("total_given")]
    public decimal? TotalGiven { get; set; }

    [Column("region")]
    [MaxLength(100)]
    public string? Region { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    public ICollection<Donation>? Donations { get; set; }
}
