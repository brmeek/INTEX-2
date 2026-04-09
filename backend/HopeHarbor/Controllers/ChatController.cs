using System.ComponentModel.DataAnnotations;
using HopeHarbor.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace HopeHarbor.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    public sealed class ChatMessageDto
    {
        [Required]
        [RegularExpression("^(user|assistant)$")]
        public string Role { get; set; } = "user";

        [Required]
        [StringLength(1500)]
        public string Content { get; set; } = string.Empty;
    }

    public sealed class ChatAskRequest
    {
        [Required]
        [StringLength(1500)]
        public string Message { get; set; } = string.Empty;

        public List<ChatMessageDto> History { get; set; } = [];
    }

    [HttpPost("ask")]
    [AllowAnonymous]
    [EnableRateLimiting("public-anon")]
    public async Task<IActionResult> Ask(
        [FromBody] ChatAskRequest request,
        [FromServices] IChatbotService chatbotService,
        CancellationToken cancellationToken)
    {
        var history = request.History
            .Where(item => !string.IsNullOrWhiteSpace(item.Content))
            .Select(item => new ChatHistoryItem(item.Role.Trim().ToLowerInvariant(), item.Content.Trim()))
            .ToList();

        var result = await chatbotService.AskAsync(request.Message.Trim(), history, cancellationToken);

        return Ok(new
        {
            answer = result.Answer,
            citations = result.Citations.Select(c => new { title = c.Title, url = c.Url }),
        });
    }
}
