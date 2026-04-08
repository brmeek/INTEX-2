using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HopeHarbor.Data;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
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
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request,
        SignInManager<ApplicationUser> signInManager,
        UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return Unauthorized(new { message = "Invalid email or password." });

        var result = await signInManager.PasswordSignInAsync(
            user.UserName ?? request.Email,
            request.Password,
            isPersistent: false,
            lockoutOnFailure: false);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid email or password." });

        var roles = await userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, roles });
    }

    [HttpPost("register-donor")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterDonor(
        [FromBody] RegisterDonorRequest request,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return Conflict(new { message = "An account with that email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var message = createResult.Errors.FirstOrDefault()?.Description ?? "Could not create account.";
            return BadRequest(new { message });
        }

        var addRoleResult = await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        if (!addRoleResult.Succeeded)
        {
            var message = addRoleResult.Errors.FirstOrDefault()?.Description ?? "Could not assign donor role.";
            return BadRequest(new { message });
        }

        await signInManager.SignInAsync(user, isPersistent: false);
        var roles = await userManager.GetRolesAsync(user);
        return Ok(new { email = user.Email, roles });
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

        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
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
