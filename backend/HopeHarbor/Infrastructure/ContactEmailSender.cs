using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;

namespace HopeHarbor.Infrastructure;

public interface IContactEmailSender
{
    Task SendAsync(ContactEmailMessage message, CancellationToken cancellationToken = default);
}

public sealed record ContactEmailMessage(
    string Name,
    string Email,
    string Subject,
    string Message,
    string? IpAddress);

public sealed class ContactEmailSender : IContactEmailSender
{
    private readonly ContactEmailOptions _options;

    public ContactEmailSender(IOptions<ContactEmailOptions> options)
    {
        _options = options.Value;
    }

    public async Task SendAsync(ContactEmailMessage message, CancellationToken cancellationToken = default)
    {
        var validationError = _options.GetValidationError();
        if (validationError is not null)
            throw new InvalidOperationException(validationError);

        using var mailMessage = new MailMessage
        {
            From = new MailAddress(_options.FromAddress, _options.FromName),
            Subject = $"Hope Harbor Contact: {message.Subject}",
            Body = BuildBody(message),
            IsBodyHtml = false
        };

        mailMessage.To.Add(_options.ToAddress);
        mailMessage.ReplyToList.Add(new MailAddress(message.Email, message.Name));

        using var smtpClient = new SmtpClient(_options.SmtpHost, _options.SmtpPort)
        {
            EnableSsl = _options.EnableSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_options.SmtpUsername, _options.SmtpPassword),
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        await smtpClient.SendMailAsync(mailMessage, cancellationToken);
    }

    private static string BuildBody(ContactEmailMessage message)
    {
        return
$@"Contact form submission

Submitted at (UTC): {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}
Name: {message.Name}
Email: {message.Email}
Subject: {message.Subject}
IP Address: {message.IpAddress ?? "Unknown"}

Message:
{message.Message}";
    }
}
