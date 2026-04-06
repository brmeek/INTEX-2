using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace HopeHarbor.Models;

[Table("education_records")]
public class EducationRecord
{
    [Key]
    [Column("education_record_id")]
    public int EducationRecordId { get; set; }

    [Column("resident_id")]
    public int? ResidentId { get; set; }

    [ForeignKey("ResidentId")]
    public Resident? Resident { get; set; }

    [Column("record_date")]
    public DateOnly? RecordDate { get; set; }

    [Column("education_level")]
    [MaxLength(100)]
    public string? EducationLevel { get; set; }

    [Column("school_name")]
    [MaxLength(255)]
    public string? SchoolName { get; set; }

    [Column("enrollment_status")]
    [MaxLength(50)]
    public string? EnrollmentStatus { get; set; }

    [Column("attendance_rate")]
    public decimal? AttendanceRate { get; set; }

    [Column("progress_percent")]
    public decimal? ProgressPercent { get; set; }

    [Column("completion_status")]
    [MaxLength(50)]
    public string? CompletionStatus { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }
}
