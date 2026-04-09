using Microsoft.AspNetCore.Identity;

namespace HopeHarbor.Data;

// Bootstrap admin: GenerateDefaultIdentity:* via user-secrets, env, or .env (GenerateDefaultIdentity__*).
public static class AuthIdentityGenerator
{
    public static async Task GenerateDefaultIdentityAsync(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var roleResult = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (!roleResult.Succeeded)
                    throw new Exception($"Unable to create role: {roleName}");
            }
        }

        var adminEmail = configuration["GenerateDefaultIdentity:AdminEmail"];
        var adminPassword = configuration["GenerateDefaultIdentity:AdminPassword"];

        if (string.IsNullOrWhiteSpace(adminEmail) || string.IsNullOrWhiteSpace(adminPassword))
            return;

        var admin = await userManager.FindByEmailAsync(adminEmail);
        if (admin == null)
        {
            admin = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(admin, adminPassword);
            if (!createResult.Succeeded)
                throw new Exception("Unable to create admin user.");
        }

        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
        {
            if (await userManager.IsInRoleAsync(admin, roleName))
                continue;

            var addRoleResult = await userManager.AddToRoleAsync(admin, roleName);
            if (!addRoleResult.Succeeded)
                throw new Exception($"Unable to assign {roleName} role.");
        }
    }
}
