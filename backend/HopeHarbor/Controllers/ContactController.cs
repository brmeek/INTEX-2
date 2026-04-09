using System.ComponentModel.DataAnnotations;
using HopeHarbor.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/contact")]
public class ContactController : ControllerBase
{
    public sealed class ContactRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        [StringLength(256)]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(120)]
        public string Subject { get; set; } = string.Empty;

        [Required]
        [StringLength(4000)]
        public string Message { get; set; } = string.Empty;
    }

    [HttpPost]
    [AllowAnonymous]
    [EnableRateLimiting("public-anon")]
    public async Task<IActionResult> SendMessage(
        [FromBody] ContactRequest request,
        [FromServices] IContactEmailSender emailSender,
        [FromServices] ILogger<ContactController> logger,
        CancellationToken cancellationToken)
    {
        try
        {
            await emailSender.SendAsync(
                new ContactEmailMessage(
                    request.Name.Trim(),
                    request.Email.Trim(),
                    request.Subject.Trim(),
                    request.Message.Trim(),
                    HttpContext.Connection.RemoteIpAddress?.ToString()),
                cancellationToken);

            return Ok(new { message = "Message sent successfully." });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send contact email.");
            return Problem(
                title: "Unable to send message",
                detail: "The contact form could not send your message right now. Please try again later.",
                statusCode: StatusCodes.Status500InternalServerError);
        }
    }
}
