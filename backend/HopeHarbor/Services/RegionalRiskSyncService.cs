using System.Text.Json;
using HopeHarbor.Data;
using HopeHarbor.Models;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Services;

public sealed class RegionalRiskSyncService
{
    private readonly HopeHarborContext _db;
    private readonly ILogger<RegionalRiskSyncService> _logger;

    public RegionalRiskSyncService(HopeHarborContext db, ILogger<RegionalRiskSyncService> logger)
    {
        _db = db;
        _logger = logger;
    }

    public async Task<SyncResult> SyncFromJsonFileAsync(string jsonPath, string sourcePipeline, CancellationToken cancellationToken)
    {
        if (!File.Exists(jsonPath))
        {
            return new SyncResult(0, $"Risk JSON file not found: {jsonPath}");
        }

        var payload = await File.ReadAllTextAsync(jsonPath, cancellationToken);
        var parsed = JsonSerializer.Deserialize<RegionalRiskPayload>(payload, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (parsed?.Regions == null || parsed.Regions.Count == 0)
        {
            return new SyncResult(0, "Risk JSON payload had no regions.");
        }

        var normalized = parsed.Regions
            .Where(r => !string.IsNullOrWhiteSpace(r.Region))
            .Select(r => new
            {
                Region = r.Region!.Trim(),
                RiskScore = Math.Clamp(r.RiskScore, 0m, 100m)
            })
            .GroupBy(x => x.Region, StringComparer.OrdinalIgnoreCase)
            .Select(g => g.First())
            .ToList();

        if (normalized.Count == 0)
        {
            return new SyncResult(0, "Risk JSON payload had no valid regions after normalization.");
        }

        var nowUtc = DateTime.UtcNow;
        var regions = normalized.Select(n => n.Region).ToList();
        var existing = await _db.RegionalRiskSnapshots
            .Where(r => regions.Contains(r.Region))
            .ToListAsync(cancellationToken);

        foreach (var incoming in normalized)
        {
            var current = existing.FirstOrDefault(e =>
                e.Region.Equals(incoming.Region, StringComparison.OrdinalIgnoreCase));

            if (current == null)
            {
                _db.RegionalRiskSnapshots.Add(new RegionalRiskSnapshot
                {
                    Region = incoming.Region,
                    RiskScore = incoming.RiskScore,
                    SourcePipeline = sourcePipeline,
                    UpdatedAtUtc = nowUtc
                });
            }
            else
            {
                current.RiskScore = incoming.RiskScore;
                current.SourcePipeline = sourcePipeline;
                current.UpdatedAtUtc = nowUtc;
            }
        }

        var count = await _db.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Regional risk sync complete. Regions processed: {RegionCount}; Db changes: {DbChanges}", normalized.Count, count);
        return new SyncResult(normalized.Count, null);
    }
}

public sealed record SyncResult(int ProcessedRegions, string? Error);

public sealed class RegionalRiskPayload
{
    public List<RegionalRiskInput> Regions { get; set; } = [];
}

public sealed class RegionalRiskInput
{
    public string? Region { get; set; }
    public decimal RiskScore { get; set; }
}
