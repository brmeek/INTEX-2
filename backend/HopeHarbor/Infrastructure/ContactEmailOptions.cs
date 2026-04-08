namespace HopeHarbor.Infrastructure;

public sealed class ContactEmailOptions
{
    public string SmtpHost { get; set; } = "smtp.gmail.com";
    public int SmtpPort { get; set; } = 587;
    public bool EnableSsl { get; set; } = true;
    public string SmtpUsername { get; set; } = string.Empty;
    public string SmtpPassword { get; set; } = string.Empty;
    public string ToAddress { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = "Hope Harbor Contact";

    public string? GetValidationError()
    {
        if (string.IsNullOrWhiteSpace(SmtpHost)) return "Contact email SMTP host is missing.";
        if (SmtpPort <= 0) return "Contact email SMTP port is invalid.";
        if (string.IsNullOrWhiteSpace(SmtpUsername)) return "Contact email SMTP username is missing.";
        if (string.IsNullOrWhiteSpace(SmtpPassword)) return "Contact email SMTP password is missing.";
        if (string.IsNullOrWhiteSpace(ToAddress)) return "Contact email recipient address is missing.";
        if (string.IsNullOrWhiteSpace(FromAddress)) return "Contact email sender address is missing.";

        return null;
    }
}
