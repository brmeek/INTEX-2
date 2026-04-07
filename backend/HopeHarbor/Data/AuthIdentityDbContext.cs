using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Data;

public class AuthIdentityDbContext : IdentityDbContext<ApplicationUser>
{
    public AuthIdentityDbContext(DbContextOptions<AuthIdentityDbContext> options) : base(options)
    {
    }
}
