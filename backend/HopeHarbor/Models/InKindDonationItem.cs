using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("in_kind_donation_items")]
public class InKindDonationItem
{
    [Key]
    [Column("item_id")]
    public int ItemId { get; set; }

    [Column("donation_id")]
    public int? DonationId { get; set; }

    [ForeignKey("DonationId")]
    public Donation? Donation { get; set; }

    [Column("item_name")]
    [StringLength(255)]
    public string? ItemName { get; set; }

    [Column("item_category")]
    [StringLength(100)]
    public string? ItemCategory { get; set; }

    [Column("quantity")]
    public int? Quantity { get; set; }

    [Column("unit_of_measure")]
    [StringLength(50)]
    public string? UnitOfMeasure { get; set; }

    [Column("estimated_unit_value")]
    public decimal? EstimatedUnitValue { get; set; }

    [Column("intended_use")]
    [StringLength(100)]
    public string? IntendedUse { get; set; }

    [Column("received_condition")]
    [StringLength(50)]
    public string? ReceivedCondition { get; set; }
}
