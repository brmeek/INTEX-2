using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("safehouses")]
public class Safehouse
{
    [Key]
    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("safehouse_name")]
    [MaxLength(255)]
    public string? SafehouseName { get; set; }

    [Column("location")]
    [MaxLength(255)]
    public string? Location { get; set; }

    [Column("region")]
    [MaxLength(100)]
    public string? Region { get; set; }

    [Column("capacity")]
    public int? Capacity { get; set; }

    [Column("current_occupancy")]
    public int? CurrentOccupancy { get; set; }

    [Column("status")]
    [MaxLength(50)]
    public string? Status { get; set; }

    [Column("opened_date")]
    public DateOnly? OpenedDate { get; set; }

    [Column("contact_person")]
    [MaxLength(255)]
    public string? ContactPerson { get; set; }

    [Column("contact_phone")]
    [MaxLength(50)]
    public string? ContactPhone { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    public ICollection<Resident>? Residents { get; set; }
}
