using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using HopeHarbor.Infrastructure;
using Npgsql;
using System.Net;

var dotEnvPath = FindDotEnvPath();
if (dotEnvPath != null)
{
    LoadDotEnvIfPresent(dotEnvPath);
    Console.WriteLine($".env loaded from: {dotEnvPath}");
}
else
{
    Console.WriteLine(".env not found. Using process environment and appsettings.json values.");
}

var builder = WebApplication.CreateBuilder(args);
var (postgresConnectionString, postgresConnectionSource) = ResolvePostgresConnectionString(
    builder.Configuration,
    fullEnvKey: "ConnectionStrings__PostgresConnection",
    prefix: "Postgres",
    connectionStringKey: "PostgresConnection",
    fallback: builder.Configuration.GetConnectionString("DefaultConnection"));

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
    fallback: postgresConnectionString);

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

builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ManageCatalog, policy =>
        policy.RequireRole(AuthRoles.Admin));
});

builder.Services.Configure<IdentityOptions>(opts =>
{
    opts.Password.RequireDigit = false;
    opts.Password.RequireLowercase = false;
    opts.Password.RequireUppercase = false;
    opts.Password.RequireNonAlphanumeric = false;
    opts.Password.RequiredUniqueChars = 1;
    opts.Password.RequiredLength = 14;
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

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

using (var scope = app.Services.CreateScope())
{
    var appDb = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
    appDb.Database.EnsureCreated();

    var identityDb = scope.ServiceProvider.GetRequiredService<AuthIdentityDbContext>();
    identityDb.Database.EnsureCreated();

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
    string? fallback)
{
    var envConnectionString = Environment.GetEnvironmentVariable(fullEnvKey);
    var partsConnectionString = BuildPostgresConnectionStringFromParts(configuration, prefix);
    var configuredConnectionString = configuration.GetConnectionString(connectionStringKey);

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

static string? BuildPostgresConnectionStringFromParts(IConfiguration configuration, string prefix)
{
    var host = configuration[$"{prefix}:Host"]?.Trim();
    var database = configuration[$"{prefix}:Database"]?.Trim();
    var username = configuration[$"{prefix}:Username"]?.Trim();
    var password = configuration[$"{prefix}:Password"];

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

    if (int.TryParse(configuration[$"{prefix}:Port"], out var port))
        csb.Port = port;

    if (Enum.TryParse<SslMode>(configuration[$"{prefix}:SslMode"], true, out var sslMode))
        csb.SslMode = sslMode;

    return csb.ConnectionString;
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
