using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Infrastructure;
using HopeHarbor.Services;
using Npgsql;
using System.Net;
using System.Threading.RateLimiting;

var dotEnvPath = FindDotEnvPath();
if (dotEnvPath != null)
{
    LoadDotEnvIfPresent(dotEnvPath);
    Console.WriteLine($".env loaded from: {dotEnvPath}");
}
else
{
    Console.WriteLine(".env not found. Using process environment values.");
}

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
});
var runStartupSchemaChecks = ResolveStartupFlag(
    envKey: "RUN_STARTUP_SCHEMA_CHECKS",
    configKey: "Startup__RunSchemaChecks",
    defaultValue: false);
var runStartupScoring = ResolveStartupFlag(
    envKey: "RUN_STARTUP_SCORING",
    configKey: "Startup__RunScoring",
    defaultValue: builder.Environment.IsDevelopment());
Console.WriteLine($"Startup schema/table checks enabled: {runStartupSchemaChecks}");
Console.WriteLine($"Startup scoring enabled: {runStartupScoring}");
// Always resolve DB connections from environment variables (.env / process env).
// Do not read connection strings from appsettings to avoid accidental bad host fallbacks.
var allowConfiguredConnectionStrings = false;
Console.WriteLine($"ConnectionStrings from appsettings enabled: {allowConfiguredConnectionStrings}");

// IMPORTANT: Production must use env-only database settings.
// Do not reintroduce appsettings fallback for Postgres in non-development environments.
var (postgresConnectionString, postgresConnectionSource) = ResolvePostgresConnectionString(
    builder.Configuration,
    fullEnvKey: "ConnectionStrings__PostgresConnection",
    prefix: "Postgres",
    connectionStringKey: "PostgresConnection",
    fallback: null,
    allowConfiguredConnectionString: allowConfiguredConnectionStrings);

if (string.IsNullOrWhiteSpace(postgresConnectionString))
{
    throw new InvalidOperationException(
        "Postgres connection string is required. Configure ConnectionStrings__PostgresConnection or Postgres__Host/Port/Database/Username/Password.");
}

var (identityConnectionString, identityConnectionSource) = ResolvePostgresConnectionString(
    builder.Configuration,
    fullEnvKey: "ConnectionStrings__IdentityConnection",
    prefix: "IdentityPostgres",
    connectionStringKey: "IdentityConnection",
    fallback: postgresConnectionString,
    allowConfiguredConnectionString: allowConfiguredConnectionStrings);

if (string.IsNullOrWhiteSpace(identityConnectionString))
{
    throw new InvalidOperationException(
        "Identity Postgres connection string is required. Configure ConnectionStrings__IdentityConnection or IdentityPostgres__Host/Port/Database/Username/Password.");
}

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddOpenApi();
builder.Services.Configure<ContactEmailOptions>(builder.Configuration.GetSection("ContactEmail"));
builder.Services.AddScoped<IContactEmailSender, ContactEmailSender>();
builder.Services.AddHttpClient<IChatbotService, ChatbotService>();

builder.Services.AddDbContext<HopeHarborContext>(opts =>
    opts.UseNpgsql(postgresConnectionString));

Console.WriteLine("Database provider in use: Postgres");
Console.WriteLine($"App Postgres connection source: {postgresConnectionSource}");
Console.WriteLine($"Identity Postgres connection source: {identityConnectionSource}");
var appPg = new NpgsqlConnectionStringBuilder(postgresConnectionString);
var identityPg = new NpgsqlConnectionStringBuilder(identityConnectionString);
Console.WriteLine($"App Postgres target: {appPg.Host}:{appPg.Port}/{appPg.Database}");
Console.WriteLine($"Identity Postgres target: {identityPg.Host}:{identityPg.Port}/{identityPg.Database}");

builder.Services.AddDbContext<AuthIdentityDbContext>(opts =>
    opts.UseNpgsql(identityConnectionString));
builder.Services.AddScoped<IDonorChurnScoringService, DonorChurnScoringService>();
builder.Services.AddScoped<IResidentReintegrationScoringService, ResidentReintegrationScoringService>();
builder.Services.AddScoped<ISocialMediaConversionScoringService, SocialMediaConversionScoringService>();
builder.Services.AddScoped<ISafehouseEducationForecastingService, SafehouseEducationForecastingService>();
builder.Services.AddScoped<IInKindDonationValuationService, InKindDonationValuationService>();
builder.Services.AddScoped<IDonorImpactForecastingService, DonorImpactForecastingService>();
builder.Services.AddScoped<IPipelineRunTracker, PipelineRunTracker>();
builder.Services.AddHostedService<NightlyPipelineRefreshService>();

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ManageCatalog, policy =>
        policy.RequireRole(AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.ViewAdminData, policy =>
        policy.RequireRole(AuthRoles.Admin));
    options.AddPolicy(AuthPolicies.DonorOrAdmin, policy =>
        policy.RequireRole(AuthRoles.Donor, AuthRoles.Admin));
});

builder.Services.Configure<IdentityOptions>(opts =>
{
    opts.Password.RequireDigit = false;
    opts.Password.RequireLowercase = false;
    opts.Password.RequireUppercase = false;
    opts.Password.RequireNonAlphanumeric = false;
    opts.Password.RequiredUniqueChars = 1;
    opts.Password.RequiredLength = 14;
    opts.Lockout.AllowedForNewUsers = true;
    opts.Lockout.MaxFailedAccessAttempts = 5;
    opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
    opts.User.RequireUniqueEmail = true;
});

builder.Services.ConfigureApplicationCookie(opts =>
{
    opts.Cookie.HttpOnly = true;
    opts.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    opts.Cookie.SameSite = SameSiteMode.Lax;
    opts.SlidingExpiration = true;
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.SetIsOriginAllowed(IsAllowedDevelopmentOrigin)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            """{"message":"Too many requests. Please try again later."}""",
            cancellationToken);
    };

    options.AddPolicy("auth-anon", httpContext =>
    {
        var partitionKey = GetRateLimitPartitionKey(httpContext);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 8,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });

    options.AddPolicy("public-anon", httpContext =>
    {
        var partitionKey = GetRateLimitPartitionKey(httpContext);
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey,
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 30,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0,
                AutoReplenishment = true
            });
    });
});

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

using (var scope = app.Services.CreateScope())
{
    var appDb = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
    await EnsurePipelineRunsTableAsync(appDb);
    if (runStartupSchemaChecks)
    {
        appDb.Database.EnsureCreated();
        await EnsureDonorChurnScoresTableAsync(appDb);
        await EnsureResidentReadinessScoresTableAsync(appDb);
        await EnsureSocialMediaConversionPredictionsTableAsync(appDb);
        await EnsureSafehouseEducationForecastsTableAsync(appDb);
    }
    else
    {
        Console.WriteLine("Skipping startup app database schema/table checks.");
    }

    var identityDb = scope.ServiceProvider.GetRequiredService<AuthIdentityDbContext>();
    if (runStartupSchemaChecks)
    {
        identityDb.Database.EnsureCreated();
    }
    else
    {
        Console.WriteLine("Skipping startup identity database schema checks.");
    }

    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(
        scope.ServiceProvider, builder.Configuration);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseSecurityHeaders(app.Environment);
app.UseCors();
app.UseRateLimiter();

var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapIdentityApi<ApplicationUser>();
app.MapControllers();

_ = Task.Run(async () =>
{
    if (!runStartupScoring)
    {
        Console.WriteLine("Skipping startup scoring.");
        return;
    }

    try
    {
        using var startupScope = app.Services.CreateScope();
        var startupDb = startupScope.ServiceProvider.GetRequiredService<HopeHarborContext>();
        var donorChurnScoringService = startupScope.ServiceProvider.GetRequiredService<IDonorChurnScoringService>();
        var residentReintegrationScoringService = startupScope.ServiceProvider.GetRequiredService<IResidentReintegrationScoringService>();
        var safehouseEducationForecastingService = startupScope.ServiceProvider.GetRequiredService<ISafehouseEducationForecastingService>();
        var pipelineRunTracker = startupScope.ServiceProvider.GetRequiredService<IPipelineRunTracker>();

        async Task<int?> RunStartupPipelineAsync(
            string pipelineName,
            string modelVersion,
            Func<CancellationToken, Task<int>> scoreFunc,
            CancellationToken cancellationToken)
        {
            var runId = await pipelineRunTracker.StartAsync(
                pipelineName,
                "startup",
                "system",
                modelVersion,
                cancellationToken);

            try
            {
                var rowsScored = await scoreFunc(cancellationToken);
                await pipelineRunTracker.CompleteSuccessAsync(runId, rowsScored, cancellationToken);
                return rowsScored;
            }
            catch (Exception ex)
            {
                await pipelineRunTracker.CompleteFailureAsync(runId, ex, cancellationToken);
                Console.WriteLine($"Startup scoring pipeline '{pipelineName}' failed: {ex.Message}");
                return null;
            }
        }

        var donorCount = await RunStartupPipelineAsync(
            pipelineName: "donor_churn",
            modelVersion: "donor-churn-v1",
            scoreFunc: ct => donorChurnScoringService.ScoreAllAsync(startupDb, ct),
            cancellationToken: CancellationToken.None);

        var residentCount = await RunStartupPipelineAsync(
            pipelineName: "resident_reintegration",
            modelVersion: "reintegration-readiness-v1",
            scoreFunc: ct => residentReintegrationScoringService.ScoreAllAsync(startupDb, ct),
            cancellationToken: CancellationToken.None);

        var safehouseCount = await RunStartupPipelineAsync(
            pipelineName: "safehouse_education_forecast",
            modelVersion: "safehouse-education-forecast-v2",
            scoreFunc: ct => safehouseEducationForecastingService.ScoreAllAsync(startupDb, ct),
            cancellationToken: CancellationToken.None);

        Console.WriteLine(
            $"Startup scoring complete. Donors scored: {donorCount?.ToString() ?? "failed"}, residents scored: {residentCount?.ToString() ?? "failed"}, safehouses scored: {safehouseCount?.ToString() ?? "failed"}");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Startup scoring warning: {ex.Message}");
    }
});

if (Directory.Exists(wwwroot))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

static (string? ConnectionString, string Source) ResolvePostgresConnectionString(
    IConfiguration configuration,
    string fullEnvKey,
    string prefix,
    string connectionStringKey,
    string? fallback,
    bool allowConfiguredConnectionString)
{
    var envConnectionString = Environment.GetEnvironmentVariable(fullEnvKey);
    var partsConnectionString = BuildPostgresConnectionStringFromParts(prefix);
    var configuredConnectionString = allowConfiguredConnectionString
        ? configuration.GetConnectionString(connectionStringKey)
        : null;

    var connectionString =
        (string.IsNullOrWhiteSpace(envConnectionString) ? null : envConnectionString)
        ?? partsConnectionString
        ?? configuredConnectionString
        ?? fallback;

    var source =
        !string.IsNullOrWhiteSpace(envConnectionString) ? $"env:{fullEnvKey}"
        : partsConnectionString != null ? $"env:{prefix}__*"
        : configuredConnectionString != null ? $"config:ConnectionStrings:{connectionStringKey}"
        : fallback != null ? "fallback:shared-postgres"
        : "none";

    return (connectionString, source);
}

static string? BuildPostgresConnectionStringFromParts(string prefix)
{
    // Env-only parsing by design: values are expected in Postgres__* / IdentityPostgres__*.
    var host = GetEnvironmentValue($"{prefix}__Host")?.Trim();
    var database = GetEnvironmentValue($"{prefix}__Database")?.Trim();
    var username = GetEnvironmentValue($"{prefix}__Username")?.Trim();
    var password = GetEnvironmentValue($"{prefix}__Password");

    if (string.IsNullOrWhiteSpace(host)
        || string.IsNullOrWhiteSpace(database)
        || string.IsNullOrWhiteSpace(username))
    {
        return null;
    }

    var csb = new NpgsqlConnectionStringBuilder
    {
        Host = host,
        Database = database,
        Username = username
    };

    if (!string.IsNullOrWhiteSpace(password))
        csb.Password = password;

    if (int.TryParse(GetEnvironmentValue($"{prefix}__Port"), out var port))
        csb.Port = port;

    if (Enum.TryParse<SslMode>(GetEnvironmentValue($"{prefix}__SslMode"), true, out var sslMode))
        csb.SslMode = sslMode;

    return csb.ConnectionString;
}

static string? GetEnvironmentValue(string key)
{
    return Environment.GetEnvironmentVariable(key)
           ?? Environment.GetEnvironmentVariable(key.Replace("__", ":"));
}

static bool ResolveStartupFlag(string envKey, string configKey, bool defaultValue)
{
    if (bool.TryParse(Environment.GetEnvironmentVariable(envKey), out var envValue))
        return envValue;

    if (bool.TryParse(GetEnvironmentValue(configKey), out var configValue))
        return configValue;

    return defaultValue;
}

static string GetRateLimitPartitionKey(HttpContext context)
{
    return context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}

static bool IsAllowedDevelopmentOrigin(string origin)
{
    if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri))
        return false;

    if (uri.Scheme == Uri.UriSchemeHttps
        && uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        && uri.Port == 5173)
    {
        return true;
    }

    if (uri.Scheme != Uri.UriSchemeHttp || uri.Port is not 5173 and not 8080)
        return false;

    if (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
        || uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)
        || uri.Host.Equals("::1", StringComparison.OrdinalIgnoreCase))
    {
        return true;
    }

    if (!IPAddress.TryParse(uri.Host, out var ipAddress))
        return false;

    var bytes = ipAddress.GetAddressBytes();
    if (bytes.Length != 4)
        return false;

    var is10 = bytes[0] == 10;
    var is192 = bytes[0] == 192 && bytes[1] == 168;
    var is172 = bytes[0] == 172 && bytes[1] is >= 16 and <= 31;

    return is10 || is192 || is172;
}

static string? FindDotEnvPath()
{
    var candidates = new[]
    {
        Path.Combine(Directory.GetCurrentDirectory(), ".env"),
        Path.Combine(Directory.GetCurrentDirectory(), "backend", "HopeHarbor", ".env"),
        Path.Combine(AppContext.BaseDirectory, ".env"),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".env")),
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", ".env")),
    };

    return candidates.FirstOrDefault(File.Exists);
}

static void LoadDotEnvIfPresent(string dotEnvPath)
{
    if (!File.Exists(dotEnvPath))
        return;

    foreach (var rawLine in File.ReadAllLines(dotEnvPath))
    {
        var line = rawLine.Trim();
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
            continue;

        var equalsIndex = line.IndexOf('=');
        if (equalsIndex <= 0)
            continue;

        var key = line[..equalsIndex].Trim();
        var value = line[(equalsIndex + 1)..].Trim();

        if ((value.StartsWith("\"") && value.EndsWith("\"")) || (value.StartsWith("'") && value.EndsWith("'")))
            value = value[1..^1];

        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(key)))
            Environment.SetEnvironmentVariable(key, value);
    }
}

static async Task EnsureDonorChurnScoresTableAsync(HopeHarborContext db)
{
    var sql = """
        CREATE TABLE IF NOT EXISTS donor_churn_scores (
            supporter_id INT PRIMARY KEY REFERENCES supporters(supporter_id) ON DELETE CASCADE,
            churn_probability NUMERIC(6,4) NOT NULL,
            churn_predicted BOOLEAN NOT NULL,
            risk_tier VARCHAR(20) NOT NULL,
            scored_at_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            model_version VARCHAR(100) NOT NULL,
            days_since_last_donation INT NOT NULL,
            has_recurring_donation BOOLEAN NOT NULL,
            num_campaigns_participated INT NOT NULL,
            giving_trajectory NUMERIC(8,4) NOT NULL,
            skipped_most_recent_campaign BOOLEAN NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_donor_churn_scores_risk_tier ON donor_churn_scores(risk_tier);
        CREATE INDEX IF NOT EXISTS ix_donor_churn_scores_churn_probability ON donor_churn_scores(churn_probability DESC);
    """;

    await db.Database.ExecuteSqlRawAsync(sql);
}

static async Task EnsureResidentReadinessScoresTableAsync(HopeHarborContext db)
{
    var sql = """
        CREATE TABLE IF NOT EXISTS resident_reintegration_scores (
            resident_id INT PRIMARY KEY REFERENCES residents(resident_id) ON DELETE CASCADE,
            readiness_score NUMERIC(6,4) NOT NULL,
            readiness_tier VARCHAR(40) NOT NULL,
            top_concern_feature VARCHAR(100) NOT NULL,
            trend_label VARCHAR(40) NOT NULL,
            history_months_used INT NOT NULL,
            month_over_month_change NUMERIC(8,4) NULL,
            first_vs_latest_change NUMERIC(8,4) NULL,
            initial_vs_latest_change NUMERIC(8,4) NULL,
            trajectory_slope NUMERIC(8,4) NULL,
            scored_at_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            model_version VARCHAR(100) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_resident_reintegration_scores_tier ON resident_reintegration_scores(readiness_tier);
        CREATE INDEX IF NOT EXISTS ix_resident_reintegration_scores_score ON resident_reintegration_scores(readiness_score DESC);
        CREATE INDEX IF NOT EXISTS ix_resident_reintegration_scores_trend ON resident_reintegration_scores(trend_label);
    """;

    await db.Database.ExecuteSqlRawAsync(sql);
}

static async Task EnsureSocialMediaConversionPredictionsTableAsync(HopeHarborContext db)
{
    var sql = """
        CREATE TABLE IF NOT EXISTS social_media_conversion_predictions (
            prediction_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            platform VARCHAR(50) NOT NULL,
            post_type VARCHAR(50) NOT NULL,
            media_type VARCHAR(50) NOT NULL,
            sentiment_tone VARCHAR(50) NOT NULL,
            content_topic VARCHAR(100) NOT NULL,
            has_call_to_action BOOLEAN NOT NULL,
            call_to_action_type VARCHAR(100) NULL,
            is_boosted BOOLEAN NOT NULL,
            boost_budget_php NUMERIC(12,2) NOT NULL,
            num_hashtags INT NOT NULL,
            caption_length INT NOT NULL,
            features_resident_story BOOLEAN NOT NULL,
            campaign_name VARCHAR(255) NULL,
            predicted_log_referrals NUMERIC(8,4) NOT NULL,
            predicted_referrals NUMERIC(12,2) NOT NULL,
            prediction_confidence VARCHAR(20) NOT NULL,
            model_version VARCHAR(100) NOT NULL,
            scored_at_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_social_media_conversion_predictions_scored_at
            ON social_media_conversion_predictions(scored_at_utc DESC);
    """;

    await db.Database.ExecuteSqlRawAsync(sql);
}

static async Task EnsureSafehouseEducationForecastsTableAsync(HopeHarborContext db)
{
    var sql = """
        CREATE TABLE IF NOT EXISTS safehouse_education_forecasts (
            safehouse_id INT PRIMARY KEY REFERENCES safehouses(safehouse_id) ON DELETE CASCADE,
            forecast_for_month DATE NOT NULL,
            predicted_education_score NUMERIC(6,2) NOT NULL,
            latest_observed_score NUMERIC(6,2) NOT NULL,
            previous_observed_score NUMERIC(6,2) NULL,
            trajectory_slope NUMERIC(8,4) NULL,
            history_months_used INT NOT NULL,
            alert_flag BOOLEAN NOT NULL,
            alert_reason VARCHAR(120) NOT NULL,
            scored_at_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            model_version VARCHAR(100) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_safehouse_education_forecasts_alert
            ON safehouse_education_forecasts(alert_flag);
        CREATE INDEX IF NOT EXISTS ix_safehouse_education_forecasts_score
            ON safehouse_education_forecasts(predicted_education_score);
    """;

    await db.Database.ExecuteSqlRawAsync(sql);
}

static async Task EnsurePipelineRunsTableAsync(HopeHarborContext db)
{
    var sql = """
        CREATE TABLE IF NOT EXISTS pipeline_runs (
            run_id INT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
            pipeline_name VARCHAR(100) NOT NULL,
            trigger_source VARCHAR(50) NOT NULL,
            status VARCHAR(20) NOT NULL,
            started_at_utc TIMESTAMP WITHOUT TIME ZONE NOT NULL,
            finished_at_utc TIMESTAMP WITHOUT TIME ZONE NULL,
            rows_scored INT NULL,
            model_version VARCHAR(100) NULL,
            initiated_by VARCHAR(255) NULL,
            error_message TEXT NULL
        );

        CREATE INDEX IF NOT EXISTS ix_pipeline_runs_pipeline_started
            ON pipeline_runs(pipeline_name, started_at_utc DESC);
        CREATE INDEX IF NOT EXISTS ix_pipeline_runs_status_started
            ON pipeline_runs(status, started_at_utc DESC);
    """;

    await db.Database.ExecuteSqlRawAsync(sql);
}
