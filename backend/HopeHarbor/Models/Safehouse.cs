using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("safehouses")]
public class Safehouse
{
    [Key]
    [Column("safehouse_id")]
    public int SafehouseId { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string? SafehouseName { get; set; }

    [Column("city")]
    [StringLength(255)]
    public string? Location { get; set; }

    [Column("region")]
    [StringLength(100)]
    public string? Region { get; set; }

    [Column("capacity_girls")]
    public int? Capacity { get; set; }

    [Column("current_occupancy")]
    public int? CurrentOccupancy { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("open_date")]
    public DateOnly? OpenedDate { get; set; }

    [NotMapped]
    [StringLength(255)]
    public string? ContactPerson { get; set; }

    [NotMapped]
    [StringLength(50)]
    public string? ContactPhone { get; set; }

    [Column("notes")]
    [StringLength(2000)]
    public string? Notes { get; set; }

    public ICollection<Resident>? Residents { get; set; }
}
