using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using HopeHarbor.Data;
using System.Data.Common;
using System.Net.Sockets;

LoadDotEnvIfPresent(Path.Combine(Directory.GetCurrentDirectory(), ".env"));

var builder = WebApplication.CreateBuilder(args);
var configuredProvider = builder.Configuration["Database:Provider"]?.Trim() ?? "Postgres";
var fallbackToSqlite = builder.Configuration.GetValue("Database:FallbackToSqlite", true);

var sqliteConnectionString =
    builder.Configuration.GetConnectionString("SqliteConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Data Source=hopeharbor.db";

var postgresConnectionString =
    builder.Configuration.GetConnectionString("PostgresConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");

var wantsPostgres =
    configuredProvider.Equals("postgres", StringComparison.OrdinalIgnoreCase)
    || configuredProvider.Equals("postgresql", StringComparison.OrdinalIgnoreCase);

var usePostgres = wantsPostgres;
if (wantsPostgres)
{
    if (string.IsNullOrWhiteSpace(postgresConnectionString))
    {
        if (!fallbackToSqlite)
            throw new InvalidOperationException("Database provider is Postgres but no Postgres connection string was configured.");

        Console.WriteLine("Postgres provider selected, but no Postgres connection string found. Falling back to SQLite.");
        usePostgres = false;
    }
    else if (fallbackToSqlite && !CanReachPostgresHost(postgresConnectionString))
    {
        Console.WriteLine("Postgres provider selected, but the database is unreachable. Falling back to SQLite.");
        usePostgres = false;
    }
}

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });

builder.Services.AddOpenApi();

builder.Services.AddDbContext<HopeHarborContext>(opts =>
{
    if (usePostgres)
    {
        opts.UseNpgsql(postgresConnectionString!);
    }
    else
    {
        opts.UseSqlite(sqliteConnectionString);
    }
});

Console.WriteLine($"Database provider in use: {(usePostgres ? "Postgres" : "SQLite")}");

builder.Services.AddIdentity<IdentityUser, IdentityRole>(opts =>
    {
        opts.Password.RequireDigit = true;
        opts.Password.RequiredLength = 8;
        opts.Password.RequireNonAlphanumeric = false;
        opts.Password.RequireUppercase = true;
        opts.Password.RequireLowercase = true;
    })
    .AddEntityFrameworkStores<HopeHarborContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(opts =>
{
    opts.Cookie.HttpOnly = true;
    opts.Cookie.SameSite = SameSiteMode.None;
    opts.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    opts.ExpireTimeSpan = TimeSpan.FromHours(8);
    opts.Events.OnRedirectToLogin = ctx =>
    {
        ctx.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
    opts.Events.OnRedirectToAccessDenied = ctx =>
    {
        ctx.Response.StatusCode = 403;
        return Task.CompletedTask;
    };
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:8080",
                "http://127.0.0.1:8080",
                "https://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<HopeHarborContext>();
    db.Database.EnsureCreated();

    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<IdentityUser>>();
    if (await userManager.FindByEmailAsync("admin@hopeharbor.org") == null)
    {
        var admin = new IdentityUser { UserName = "admin@hopeharbor.org", Email = "admin@hopeharbor.org", EmailConfirmed = true };
        await userManager.CreateAsync(admin, "HopeHarbor2025!");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();

var wwwroot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
if (Directory.Exists(wwwroot))
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

if (Directory.Exists(wwwroot))
{
    app.MapFallbackToFile("index.html");
}

app.Run();

static bool CanReachPostgresHost(string connectionString)
{
    try
    {
        var builder = new DbConnectionStringBuilder { ConnectionString = connectionString };

        if (!builder.TryGetValue("Host", out var hostObj) || hostObj == null)
            return false;

        var host = hostObj.ToString();
        if (string.IsNullOrWhiteSpace(host))
            return false;

        var port = 5432;
        if (builder.TryGetValue("Port", out var portObj) && int.TryParse(portObj?.ToString(), out var parsedPort))
            port = parsedPort;

        using var client = new TcpClient();
        var connectTask = client.ConnectAsync(host, port);
        var completed = connectTask.Wait(TimeSpan.FromSeconds(3));
        return completed && client.Connected;
    }
    catch
    {
        return false;
    }
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
