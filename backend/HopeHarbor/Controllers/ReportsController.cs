using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly HopeHarborContext _db;
    public ReportsController(HopeHarborContext db) => _db = db;

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard()
    {
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var totalResidents = await _db.Residents.CountAsync();
        var totalDonations = await _db.Donations.Where(d => d.Amount != null).SumAsync(d => d.Amount ?? 0);
        var donationCount = await _db.Donations.CountAsync();
        var safehouseCount = await _db.Safehouses.CountAsync();
        var recentDonations = await _db.Donations
            .Include(d => d.Supporter)
            .OrderByDescending(d => d.DonationDate)
            .Take(5)
            .ToListAsync();
        var upcomingConferences = await _db.InterventionPlans
            .Where(p => p.CaseConferenceDate != null && p.CaseConferenceDate >= DateOnly.FromDateTime(DateTime.Today))
            .OrderBy(p => p.CaseConferenceDate)
            .Take(5)
            .Include(p => p.Resident)
            .ToListAsync();

        return Ok(new
        {
            activeResidents,
            totalResidents,
            totalDonations,
            donationCount,
            safehouseCount,
            recentDonations,
            upcomingConferences
        });
    }

    [HttpGet("donation-trends")]
    public async Task<IActionResult> DonationTrends()
    {
        var trends = await _db.Donations
            .Where(d => d.DonationDate != null && d.Amount != null)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new
            {
                Year = g.Key.Year,
                Month = g.Key.Month,
                Total = g.Sum(d => d.Amount ?? 0),
                Count = g.Count()
            })
            .OrderBy(t => t.Year).ThenBy(t => t.Month)
            .ToListAsync();

        return Ok(trends);
    }

    [HttpGet("impact")]
    [AllowAnonymous]
    public async Task<IActionResult> Impact()
    {
        var currentYear = DateTime.Today.Year;
        var totalResidents = await _db.Residents.CountAsync();
        var activeResidents = await _db.Residents.CountAsync(r => r.CaseStatus == "Active");
        var reintegrated = await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed");
        var safehouseCount = await _db.Safehouses.CountAsync();
        var totalDonations = await _db.Donations.Where(d => d.Amount != null).SumAsync(d => d.Amount ?? 0);
        var totalRaisedThisYear = await _db.Donations
            .Where(d => d.Amount != null && d.DonationDate != null && d.DonationDate.Value.Year == currentYear)
            .SumAsync(d => d.Amount ?? 0);
        var donorCount = await _db.Supporters.CountAsync();
        var today = DateOnly.FromDateTime(DateTime.Today);
        var activeProgramRegions = await (
            from assignment in _db.PartnerAssignments
            join safehouse in _db.Safehouses on assignment.SafehouseId equals safehouse.SafehouseId
            where assignment.SafehouseId != null
                && !string.IsNullOrWhiteSpace(safehouse.Region)
            select new
            {
                safehouse.Region,
                assignment.Status,
                assignment.AssignmentStart,
                assignment.AssignmentEnd
            })
            .ToListAsync();
        var activeRegionCount = activeProgramRegions
            .Where(a =>
                !string.IsNullOrWhiteSpace(a.Status)
                && a.Status.Equals("Active", StringComparison.OrdinalIgnoreCase)
                && (a.AssignmentStart == null || a.AssignmentStart <= today)
                && (a.AssignmentEnd == null || a.AssignmentEnd >= today))
            .Select(a => a.Region!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Count();

        var donationAllocationRows = await _db.DonationAllocations
            .Where(a => a.AmountAllocated != null && !string.IsNullOrWhiteSpace(a.ProgramArea))
            .Select(a => new { a.ProgramArea, a.AmountAllocated })
            .ToListAsync();

        var allocationsByProgramArea = donationAllocationRows
            .GroupBy(a => a.ProgramArea!.Trim(), StringComparer.OrdinalIgnoreCase)
            .Select(g => new
            {
                programArea = g.Key,
                amountAllocated = g.Sum(a => a.AmountAllocated ?? 0)
            })
            .OrderByDescending(a => a.amountAllocated)
            .ToList();

        // Compute latest-per-resident averages in memory to avoid provider translation edge cases.
        var educationProgressRows = await _db.EducationRecords
            .Where(e => e.ProgressPercent != null)
            .Select(e => new { e.ResidentId, e.RecordDate, e.ProgressPercent })
            .ToListAsync();

        var educationProgress = educationProgressRows
            .Where(e => e.ResidentId != null)
            .GroupBy(e => e.ResidentId)
            .Select(g => g.OrderByDescending(e => e.RecordDate).First().ProgressPercent ?? 0)
            .Select(v => (double)v)
            .DefaultIfEmpty(0)
            .Average();

        var healthScoreRows = await _db.HealthWellbeingRecords
            .Where(h => h.GeneralHealthScore != null)
            .Select(h => new { h.ResidentId, h.RecordDate, h.GeneralHealthScore })
            .ToListAsync();

        var healthScores = healthScoreRows
            .Where(h => h.ResidentId != null)
            .GroupBy(h => h.ResidentId)
            .Select(g => g.OrderByDescending(h => h.RecordDate).First().GeneralHealthScore ?? 0)
            .Select(v => (double)v)
            .DefaultIfEmpty(0)
            .Average();

        var donationsByType = await _db.Donations
            .GroupBy(d => d.DonationType)
            .Select(g => new { Type = g.Key, Count = g.Count(), Total = g.Sum(d => d.EstimatedValue ?? 0) })
            .ToListAsync();

        var donationsByMonth = await _db.Donations
            .Where(d => d.DonationDate != null)
            .GroupBy(d => new { d.DonationDate!.Value.Year, d.DonationDate!.Value.Month })
            .Select(g => new { Year = g.Key.Year, Month = g.Key.Month, Total = g.Sum(d => d.EstimatedValue ?? 0), Count = g.Count() })
            .OrderBy(t => t.Year).ThenBy(t => t.Month)
            .ToListAsync();

        return Ok(new
        {
            totalResidents,
            activeResidents,
            reintegrated,
            safehouseCount,
            totalDonations,
            totalRaisedThisYear,
            donorCount,
            activeRegionCount,
            allocationsByProgramArea,
            avgEducationProgress = Math.Round(educationProgress, 1),
            avgHealthScore = Math.Round(healthScores, 1),
            donationsByType,
            donationsByMonth
        });
    }

    [HttpGet("safehouse-performance")]
    public async Task<IActionResult> SafehousePerformance()
    {
        var safehouses = await _db.Safehouses
            .Select(s => new
            {
                s.SafehouseId,
                s.SafehouseName,
                s.Region,
                s.Capacity,
                ResidentCount = s.Residents!.Count(),
                ActiveResidents = s.Residents!.Count(r => r.CaseStatus == "Active"),
            })
            .ToListAsync();

        return Ok(safehouses);
    }

    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> ResidentOutcomes()
    {
        var byStatus = await _db.Residents
            .GroupBy(r => r.CaseStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var byCategory = await _db.Residents
            .GroupBy(r => r.CaseCategory)
            .Select(g => new { Category = g.Key, Count = g.Count() })
            .ToListAsync();

        var reintegrationRate = await _db.Residents.CountAsync() > 0
            ? Math.Round(100.0 * await _db.Residents.CountAsync(r => r.ReintegrationStatus == "Completed") / await _db.Residents.CountAsync(), 1)
            : 0;

        return Ok(new { byStatus, byCategory, reintegrationRate });
    }
}

