using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using HopeHarbor.Data;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string GenericRegistrationMessage = "If the account can be created, you can now sign in.";

    public sealed class RegisterDonorRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(14)]
        public string Password { get; set; } = string.Empty;
    }

    public sealed class LoginRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-anon")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager)
    {
        var normalizedEmail = request.Email.Trim();
        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user is null)
            return Unauthorized(new { message = "Invalid email or password." });

        var result = await signInManager.PasswordSignInAsync(
            user.UserName ?? normalizedEmail,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: true);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid email or password." });

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, roles });
    }

    [HttpPost("register-donor")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-anon")]
    public async Task<IActionResult> RegisterDonor(
        [FromBody] RegisterDonorRequest request,
        UserManager<ApplicationUser> userManager)
    {
        var normalizedEmail = request.Email.Trim();
        var existingUser = await userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            await Task.Delay(TimeSpan.FromMilliseconds(200));
            return Ok(new { message = GenericRegistrationMessage });
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return BadRequest(new { message = "Could not create account." });

        var addRoleResult = await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        if (!addRoleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return BadRequest(new { message = "Could not create account." });
        }

        return Ok(new { message = GenericRegistrationMessage });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout(SignInManager<ApplicationUser> signInManager)
    {
        await signInManager.SignOutAsync();
        return Ok("Logged out successfully.");
    }

    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> Me(UserManager<ApplicationUser> userManager)
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false,
                username = (string?)null,
                email = (string?)null,
                roles = Array.Empty<string>()
            });
        }

        var user = await userManager.GetUserAsync(User);
        if (user is null)
            return Unauthorized();

        var roles = (await userManager.GetRolesAsync(user))
            .Distinct()
            .OrderBy(r => r)
            .ToArray();

        return Ok(new
        {
            isAuthenticated = true,
            username = user.UserName,
            email = user.Email,
            roles
        });
    }
}
