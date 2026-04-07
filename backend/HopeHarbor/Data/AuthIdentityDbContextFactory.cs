using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Npgsql;

namespace HopeHarbor.Data;

public class AuthIdentityDbContextFactory : IDesignTimeDbContextFactory<AuthIdentityDbContext>
{
    public AuthIdentityDbContext CreateDbContext(string[] args)
    {
        var connectionString =
            Environment.GetEnvironmentVariable("ConnectionStrings__IdentityConnection")
            ?? BuildConnectionStringFromParts("IdentityPostgres")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__PostgresConnection")
            ?? BuildConnectionStringFromParts("Postgres")
            ?? "Host=localhost;Port=5432;Database=hopeharbor;Username=postgres;Password=postgres;SSL Mode=Disable";

        var optionsBuilder = new DbContextOptionsBuilder<AuthIdentityDbContext>();
        optionsBuilder.UseNpgsql(connectionString);
        return new AuthIdentityDbContext(optionsBuilder.Options);
    }

    private static string? BuildConnectionStringFromParts(string prefix)
    {
        var host = Environment.GetEnvironmentVariable($"{prefix}__Host")?.Trim();
        var database = Environment.GetEnvironmentVariable($"{prefix}__Database")?.Trim();
        var username = Environment.GetEnvironmentVariable($"{prefix}__Username")?.Trim();
        var password = Environment.GetEnvironmentVariable($"{prefix}__Password");

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

        if (int.TryParse(Environment.GetEnvironmentVariable($"{prefix}__Port"), out var port))
            csb.Port = port;

        if (Enum.TryParse<SslMode>(Environment.GetEnvironmentVariable($"{prefix}__SslMode"), true, out var sslMode))
            csb.SslMode = sslMode;

        return csb.ConnectionString;
    }
}
