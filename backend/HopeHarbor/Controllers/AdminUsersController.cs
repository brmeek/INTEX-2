using System.ComponentModel.DataAnnotations;
using HopeHarbor.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Roles = AuthRoles.Admin)]
public class AdminUsersController : ControllerBase
{
    public sealed class CreateUserRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(14)]
        public string Password { get; set; } = string.Empty;

        [Required]
        public List<string> Roles { get; set; } = new();
    }

    public sealed class UpdateUserRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        public string? Password { get; set; }

        [Required]
        public List<string> Roles { get; set; } = new();
    }

    private static readonly HashSet<string> AllowedRoles = new(StringComparer.OrdinalIgnoreCase)
    {
        AuthRoles.Admin,
        AuthRoles.Donor
    };

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromServices] UserManager<ApplicationUser> userManager,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = userManager.Users.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmedSearch = search.Trim();
            query = query.Where(u =>
                (u.Email != null && u.Email.Contains(trimmedSearch)) ||
                (u.UserName != null && u.UserName.Contains(trimmedSearch)));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderBy(u => u.Email)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var output = new List<object>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            output.Add(new
            {
                user.Id,
                user.Email,
                user.UserName,
                Roles = roles.OrderBy(r => r).ToArray()
            });
        }

        return Ok(new { items = output, total, page, pageSize });
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateUserRequest request,
        [FromServices] UserManager<ApplicationUser> userManager)
    {
        var normalizedRoles = NormalizeAndValidateRoles(request.Roles, out var roleValidationError);
        if (roleValidationError is not null)
            return BadRequest(new { message = roleValidationError });

        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
            return Conflict(new { message = "A user with that email already exists." });

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
            return BadRequest(new { message = GetIdentityErrorMessage(createResult, "Could not create user.") });

        var addRolesResult = await userManager.AddToRolesAsync(user, normalizedRoles);
        if (!addRolesResult.Succeeded)
            return BadRequest(new { message = GetIdentityErrorMessage(addRolesResult, "Could not assign roles.") });

        var roles = await userManager.GetRolesAsync(user);
        return Created($"/api/admin/users/{user.Id}", new
        {
            user.Id,
            user.Email,
            user.UserName,
            Roles = roles.OrderBy(r => r).ToArray()
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(
        string id,
        [FromBody] UpdateUserRequest request,
        [FromServices] UserManager<ApplicationUser> userManager)
    {
        var normalizedRoles = NormalizeAndValidateRoles(request.Roles, out var roleValidationError);
        if (roleValidationError is not null)
            return BadRequest(new { message = roleValidationError });

        var user = await userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var normalizedEmail = request.Email.Trim();
        if (!string.Equals(user.Email, normalizedEmail, StringComparison.OrdinalIgnoreCase))
        {
            var emailOwner = await userManager.FindByEmailAsync(normalizedEmail);
            if (emailOwner is not null && !string.Equals(emailOwner.Id, user.Id, StringComparison.Ordinal))
                return Conflict(new { message = "A user with that email already exists." });
        }

        user.Email = normalizedEmail;
        user.UserName = normalizedEmail;
        user.EmailConfirmed = true;

        var updateResult = await userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
            return BadRequest(new { message = GetIdentityErrorMessage(updateResult, "Could not update user.") });

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            var password = request.Password.Trim();
            if (password.Length < 14)
                return BadRequest(new { message = "Password must be at least 14 characters." });

            if (await userManager.HasPasswordAsync(user))
            {
                var removePasswordResult = await userManager.RemovePasswordAsync(user);
                if (!removePasswordResult.Succeeded)
                    return BadRequest(new { message = GetIdentityErrorMessage(removePasswordResult, "Could not reset password.") });
            }

            var addPasswordResult = await userManager.AddPasswordAsync(user, password);
            if (!addPasswordResult.Succeeded)
                return BadRequest(new { message = GetIdentityErrorMessage(addPasswordResult, "Could not set new password.") });
        }

        var currentRoles = (await userManager.GetRolesAsync(user)).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var rolesToAdd = normalizedRoles.Where(r => !currentRoles.Contains(r)).ToList();
        var rolesToRemove = currentRoles.Where(r => !normalizedRoles.Contains(r)).ToList();
        var currentUserId = userManager.GetUserId(User);

        if (string.Equals(currentUserId, user.Id, StringComparison.Ordinal)
            && rolesToRemove.Any(r => string.Equals(r, AuthRoles.Admin, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = "You cannot remove your own Admin role." });
        }

        if (rolesToRemove.Count > 0)
        {
            var removeRolesResult = await userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeRolesResult.Succeeded)
                return BadRequest(new { message = GetIdentityErrorMessage(removeRolesResult, "Could not remove roles.") });
        }

        if (rolesToAdd.Count > 0)
        {
            var addRolesResult = await userManager.AddToRolesAsync(user, rolesToAdd);
            if (!addRolesResult.Succeeded)
                return BadRequest(new { message = GetIdentityErrorMessage(addRolesResult, "Could not add roles.") });
        }

        var finalRoles = await userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.Email,
            user.UserName,
            Roles = finalRoles.OrderBy(r => r).ToArray()
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(
        string id,
        [FromServices] UserManager<ApplicationUser> userManager)
    {
        var user = await userManager.FindByIdAsync(id);
        if (user is null)
            return NotFound(new { message = "User not found." });

        var currentUserId = userManager.GetUserId(User);
        if (string.Equals(currentUserId, user.Id, StringComparison.Ordinal))
            return BadRequest(new { message = "You cannot delete your own account." });

        var deleteResult = await userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
            return BadRequest(new { message = GetIdentityErrorMessage(deleteResult, "Could not delete user.") });

        return NoContent();
    }

    private static List<string> NormalizeAndValidateRoles(IEnumerable<string>? roles, out string? error)
    {
        error = null;
        var normalizedRoles = new List<string>();
        foreach (var role in roles ?? Array.Empty<string>())
        {
            var trimmedRole = role?.Trim();
            if (string.IsNullOrWhiteSpace(trimmedRole))
                continue;

            if (string.Equals(trimmedRole, AuthRoles.Admin, StringComparison.OrdinalIgnoreCase))
            {
                normalizedRoles.Add(AuthRoles.Admin);
                continue;
            }

            if (string.Equals(trimmedRole, AuthRoles.Donor, StringComparison.OrdinalIgnoreCase))
            {
                normalizedRoles.Add(AuthRoles.Donor);
                continue;
            }

            error = "One or more requested roles are invalid.";
            return normalizedRoles;
        }

        normalizedRoles = normalizedRoles
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        if (normalizedRoles.Count == 0)
        {
            error = "At least one role is required.";
            return normalizedRoles;
        }

        if (normalizedRoles.Any(r => !AllowedRoles.Contains(r)))
        {
            error = "One or more requested roles are invalid.";
            return normalizedRoles;
        }

        return normalizedRoles;
    }

    private static string GetIdentityErrorMessage(IdentityResult result, string fallbackMessage)
    {
        return result.Errors.FirstOrDefault()?.Description ?? fallbackMessage;
    }
}
