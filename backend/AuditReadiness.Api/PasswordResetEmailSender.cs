using System.Net;
using System.Net.Mail;
using System.Text.Encodings.Web;

namespace AuditReadiness.Api;

public interface IPasswordResetEmailSender
{
    Task<bool> SendAsync(string recipientEmail, string recipientName, string resetUrl, CancellationToken cancellationToken);
}

public sealed class SmtpPasswordResetEmailSender(
    IConfiguration configuration,
    ILogger<SmtpPasswordResetEmailSender> logger) : IPasswordResetEmailSender
{
    public async Task<bool> SendAsync(string recipientEmail, string recipientName, string resetUrl, CancellationToken cancellationToken)
    {
        var host = configuration["SMTP_HOST"];
        var fromEmail = configuration["SMTP_FROM_EMAIL"];
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
        {
            logger.LogWarning("Password reset email was not sent because SMTP_HOST or SMTP_FROM_EMAIL is not configured.");
            return false;
        }

        var port = configuration.GetValue("SMTP_PORT", 587);
        var username = configuration["SMTP_USERNAME"];
        var password = configuration["SMTP_PASSWORD"];
        var fromName = configuration["SMTP_FROM_NAME"] ?? "NR Audit Readiness Portal";
        var safeName = HtmlEncoder.Default.Encode(string.IsNullOrWhiteSpace(recipientName) ? "User" : recipientName);
        var safeUrl = HtmlEncoder.Default.Encode(resetUrl);

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName),
            Subject = "Reset your NR Audit Readiness Portal password",
            IsBodyHtml = true,
            Body = $"""
                <p>Hello {safeName},</p>
                <p>A password reset was requested for your NR Audit Readiness Portal account.</p>
                <p><a href="{safeUrl}">Reset your password</a></p>
                <p>If you did not request this change, you can safely ignore this email.</p>
                """
        };
        message.To.Add(new MailAddress(recipientEmail, recipientName));

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = configuration.GetValue("SMTP_USE_SSL", true),
            UseDefaultCredentials = string.IsNullOrWhiteSpace(username),
            Credentials = string.IsNullOrWhiteSpace(username) ? null : new NetworkCredential(username, password)
        };

        try
        {
            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unable to send a password reset email.");
            return false;
        }
    }
}
