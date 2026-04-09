using HopeHarbor.Data;

namespace HopeHarbor.Services;

public sealed class NightlyPipelineRefreshService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<NightlyPipelineRefreshService> _logger;
    private readonly bool _enabled;
    private readonly int _runAtUtcHour;
    private readonly int _runAtUtcMinute;
    private readonly TimeZoneInfo _timeZone;
    private static readonly SemaphoreSlim RunLock = new(1, 1);

    public NightlyPipelineRefreshService(
        IServiceScopeFactory scopeFactory,
        IConfiguration configuration,
        ILogger<NightlyPipelineRefreshService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _enabled = ParseBool(configuration, "RUN_NIGHTLY_PIPELINE_REFRESH", "Startup__RunNightlyRefresh", false);
        _runAtUtcHour = Clamp(ParseInt(configuration, "NIGHTLY_PIPELINE_UTC_HOUR", "Startup__NightlyRefreshUtcHour", 2), 0, 23);
        _runAtUtcMinute = Clamp(ParseInt(configuration, "NIGHTLY_PIPELINE_UTC_MINUTE", "Startup__NightlyRefreshUtcMinute", 0), 0, 59);
        _timeZone = ResolveTimeZone(
            configuration["NIGHTLY_PIPELINE_TIME_ZONE"]
            ?? configuration["Startup__NightlyRefreshTimeZone"]);
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!_enabled)
        {
            _logger.LogInformation("Nightly pipeline refresh scheduler is disabled.");
            return;
        }

        _logger.LogInformation(
            "Nightly pipeline refresh scheduler is enabled. Schedule: {Hour:D2}:{Minute:D2} {TimeZone} daily.",
            _runAtUtcHour,
            _runAtUtcMinute,
            _timeZone.Id);

        while (!stoppingToken.IsCancellationRequested)
        {
            var nowUtc = DateTime.UtcNow;
            var nextRunUtc = GetNextRunUtc(nowUtc, _timeZone, _runAtUtcHour, _runAtUtcMinute);
            var delay = nextRunUtc - nowUtc;
            var nextRunLocal = TimeZoneInfo.ConvertTimeFromUtc(nextRunUtc, _timeZone);

            _logger.LogInformation(
                "Next nightly pipeline refresh is scheduled for {NextRunLocal:yyyy-MM-dd HH:mm:ss} {TimeZone} ({NextRunUtc:O}).",
                nextRunLocal,
                _timeZone.Id,
                nextRunUtc);

            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await RunNightlyRefreshAsync(stoppingToken);
        }
    }

    private async Task RunNightlyRefreshAsync(CancellationToken cancellationToken)
    {
        if (!await RunLock.WaitAsync(0, cancellationToken))
        {
            _logger.LogWarning("Nightly pipeline refresh skipped because another run is already in progress.");
            return;
        }

        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
            var donorChurnScoringService = scope.ServiceProvider.GetRequiredService<IDonorChurnScoringService>();
            var residentReintegrationScoringService = scope.ServiceProvider.GetRequiredService<IResidentReintegrationScoringService>();
            var safehouseEducationForecastingService = scope.ServiceProvider.GetRequiredService<ISafehouseEducationForecastingService>();
            var pipelineRunTracker = scope.ServiceProvider.GetRequiredService<IPipelineRunTracker>();

            async Task<int?> RunPipelineAsync(
                string pipelineName,
                string modelVersion,
                Func<CancellationToken, Task<int>> scoreFunc)
            {
                var runId = await pipelineRunTracker.StartAsync(
                    pipelineName: pipelineName,
                    triggerSource: "schedule",
                    initiatedBy: "system",
                    modelVersion: modelVersion,
                    cancellationToken: cancellationToken);

                try
                {
                    var rowsScored = await scoreFunc(cancellationToken);
                    await pipelineRunTracker.CompleteSuccessAsync(runId, rowsScored, cancellationToken);
                    return rowsScored;
                }
                catch (Exception ex)
                {
                    await pipelineRunTracker.CompleteFailureAsync(runId, ex, CancellationToken.None);
                    _logger.LogError(ex, "Scheduled pipeline '{PipelineName}' failed.", pipelineName);
                    return null;
                }
            }

            var donorCount = await RunPipelineAsync(
                pipelineName: "donor_churn",
                modelVersion: donorChurnScoringService.ModelVersion,
                scoreFunc: ct => donorChurnScoringService.ScoreAllAsync(db, ct));

            var residentCount = await RunPipelineAsync(
                pipelineName: "resident_reintegration",
                modelVersion: residentReintegrationScoringService.ModelVersion,
                scoreFunc: ct => residentReintegrationScoringService.ScoreAllAsync(db, ct));

            var safehouseCount = await RunPipelineAsync(
                pipelineName: "safehouse_education_forecast",
                modelVersion: safehouseEducationForecastingService.ModelVersion,
                scoreFunc: ct => safehouseEducationForecastingService.ScoreAllAsync(db, ct));

            _logger.LogInformation(
                "Nightly pipeline refresh complete. Donors scored: {DonorCount}, residents scored: {ResidentCount}, safehouses scored: {SafehouseCount}.",
                donorCount?.ToString() ?? "failed",
                residentCount?.ToString() ?? "failed",
                safehouseCount?.ToString() ?? "failed");
        }
        finally
        {
            RunLock.Release();
        }
    }

    private static DateTime GetNextRunUtc(DateTime nowUtc, TimeZoneInfo timeZone, int hour, int minute)
    {
        var nowLocal = TimeZoneInfo.ConvertTimeFromUtc(nowUtc, timeZone);
        var nextLocal = new DateTime(nowLocal.Year, nowLocal.Month, nowLocal.Day, hour, minute, 0, DateTimeKind.Unspecified);

        if (nextLocal <= nowLocal)
            nextLocal = nextLocal.AddDays(1);

        // Handle spring-forward gaps where a local wall-clock time may not exist.
        while (timeZone.IsInvalidTime(nextLocal))
            nextLocal = nextLocal.AddMinutes(30);

        return TimeZoneInfo.ConvertTimeToUtc(nextLocal, timeZone);
    }

    private static bool ParseBool(IConfiguration configuration, string envKey, string altKey, bool fallback)
    {
        if (bool.TryParse(configuration[envKey], out var envValue))
            return envValue;

        if (bool.TryParse(configuration[altKey], out var altValue))
            return altValue;

        return fallback;
    }

    private static int ParseInt(IConfiguration configuration, string envKey, string altKey, int fallback)
    {
        if (int.TryParse(configuration[envKey], out var envValue))
            return envValue;

        if (int.TryParse(configuration[altKey], out var altValue))
            return altValue;

        return fallback;
    }

    private static int Clamp(int value, int min, int max)
    {
        if (value < min) return min;
        if (value > max) return max;
        return value;
    }

    private static TimeZoneInfo ResolveTimeZone(string? configuredTimeZoneId)
    {
        if (string.IsNullOrWhiteSpace(configuredTimeZoneId))
            return TimeZoneInfo.Utc;

        try
        {
            return TimeZoneInfo.FindSystemTimeZoneById(configuredTimeZoneId.Trim());
        }
        catch
        {
            return TimeZoneInfo.Utc;
        }
    }
}
