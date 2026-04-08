using Microsoft.EntityFrameworkCore;
using HopeHarbor.Models;

namespace HopeHarbor.Data;

public class HopeHarborContext : DbContext
{
    public HopeHarborContext(DbContextOptions<HopeHarborContext> options) : base(options) { }

    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Donation>()
            .HasOne(d => d.Supporter)
            .WithMany(s => s.Donations)
            .HasForeignKey(d => d.SupporterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Resident>()
            .HasOne(r => r.Safehouse)
            .WithMany(s => s.Residents)
            .HasForeignKey(r => r.SafehouseId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<PartnerAssignment>()
            .HasOne(pa => pa.Partner)
            .WithMany(p => p.Assignments)
            .HasForeignKey(pa => pa.PartnerId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
