using HopeHarbor.Data;
using HopeHarbor.Models;

namespace HopeHarbor.Services;

public interface IPipelineRunTracker
{
    Task<int> StartAsync(
        string pipelineName,
        string triggerSource,
        string? initiatedBy,
        string? modelVersion,
        CancellationToken cancellationToken = default);

    Task CompleteSuccessAsync(
        int runId,
        int? rowsScored,
        CancellationToken cancellationToken = default);

    Task CompleteFailureAsync(
        int runId,
        Exception exception,
        CancellationToken cancellationToken = default);
}

public sealed class PipelineRunTracker : IPipelineRunTracker
{
    private readonly HopeHarborContext _db;

    public PipelineRunTracker(HopeHarborContext db)
    {
        _db = db;
    }

    public async Task<int> StartAsync(
        string pipelineName,
        string triggerSource,
        string? initiatedBy,
        string? modelVersion,
        CancellationToken cancellationToken = default)
    {
        var run = new PipelineRun
        {
            PipelineName = pipelineName,
            TriggerSource = triggerSource,
            Status = "Running",
            StartedAtUtc = DateTime.UtcNow,
            ModelVersion = modelVersion,
            InitiatedBy = initiatedBy
        };

        _db.PipelineRuns.Add(run);
        await _db.SaveChangesAsync(cancellationToken);
        return run.RunId;
    }

    public async Task CompleteSuccessAsync(
        int runId,
        int? rowsScored,
        CancellationToken cancellationToken = default)
    {
        var run = await _db.PipelineRuns.FindAsync([runId], cancellationToken);
        if (run is null) return;

        run.Status = "Succeeded";
        run.FinishedAtUtc = DateTime.UtcNow;
        run.RowsScored = rowsScored;
        run.ErrorMessage = null;
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task CompleteFailureAsync(
        int runId,
        Exception exception,
        CancellationToken cancellationToken = default)
    {
        var run = await _db.PipelineRuns.FindAsync([runId], cancellationToken);
        if (run is null) return;

        run.Status = "Failed";
        run.FinishedAtUtc = DateTime.UtcNow;
        run.ErrorMessage = exception.ToString();
        await _db.SaveChangesAsync(cancellationToken);
    }
}

