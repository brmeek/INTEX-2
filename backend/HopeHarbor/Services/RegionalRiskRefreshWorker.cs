namespace HopeHarbor.Services;

public sealed class RegionalRiskRefreshWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<RegionalRiskRefreshWorker> _logger;

    public RegionalRiskRefreshWorker(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<RegionalRiskRefreshWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var enabled = _configuration.GetValue("RegionalRisk__Enabled", true);
        if (!enabled)
        {
            _logger.LogInformation("Regional risk refresh worker is disabled by config.");
            return;
        }

        var intervalMinutes = _configuration.GetValue("RegionalRisk__IntervalMinutes", 5);
        if (intervalMinutes < 1)
            intervalMinutes = 1;

        var sourcePipeline = _configuration.GetValue<string>("RegionalRisk__SourcePipeline") ?? "phase1";
        var jsonPath = ResolveJsonPath();

        _logger.LogInformation("Regional risk refresh worker started. Interval: {IntervalMinutes} min; Source file: {JsonPath}", intervalMinutes, jsonPath);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var syncService = scope.ServiceProvider.GetRequiredService<RegionalRiskSyncService>();
                var result = await syncService.SyncFromJsonFileAsync(jsonPath, sourcePipeline, stoppingToken);
                if (!string.IsNullOrWhiteSpace(result.Error))
                {
                    _logger.LogWarning("Regional risk refresh skipped: {Reason}", result.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Regional risk refresh failed.");
            }

            await Task.Delay(TimeSpan.FromMinutes(intervalMinutes), stoppingToken);
        }
    }

    private string ResolveJsonPath()
    {
        var configured = _configuration.GetValue<string>("RegionalRisk__JsonPath");
        if (!string.IsNullOrWhiteSpace(configured))
            return Path.GetFullPath(configured);

        return Path.Combine(Directory.GetCurrentDirectory(), "Data", "regional-risk.json");
    }
}
