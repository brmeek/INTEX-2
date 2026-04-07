using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace HopeHarbor.Data;

public class AuthIdentityDbContextFactory : IDesignTimeDbContextFactory<AuthIdentityDbContext>
{
    public AuthIdentityDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<AuthIdentityDbContext>();
        optionsBuilder.UseSqlite("Data Source=hopeharbor.identity.db");
        return new AuthIdentityDbContext(optionsBuilder.Options);
    }
}
