namespace AuditReadiness.Api;

public interface IRegistrationAccessPolicy
{
    bool IsAllowed(string email);
}

public sealed class ConfigurationRegistrationAccessPolicy(
    IConfiguration configuration,
    IWebHostEnvironment environment) : IRegistrationAccessPolicy
{
    public bool IsAllowed(string email)
    {
        if (configuration.GetValue<bool>("REGISTRATION_ALLOW_ALL")) return true;

        var normalizedEmail = email.Trim().ToLowerInvariant();
        var allowedEmails = Parse(configuration["REGISTRATION_ALLOWED_EMAILS"]);
        var allowedDomains = Parse(configuration["REGISTRATION_ALLOWED_DOMAINS"])
            .Select(domain => domain.TrimStart('@'))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        if (allowedEmails.Contains(normalizedEmail)) return true;

        var separator = normalizedEmail.LastIndexOf('@');
        var domain = separator >= 0 ? normalizedEmail[(separator + 1)..] : string.Empty;
        if (allowedDomains.Contains(domain)) return true;

        // Local development and automated tests remain convenient unless an allowlist is supplied.
        // Production is closed by default so accidentally missing configuration cannot open signup.
        return allowedEmails.Count == 0
            && allowedDomains.Count == 0
            && (environment.IsDevelopment() || environment.IsEnvironment("Testing"));
    }

    private static HashSet<string> Parse(string? value) => string.IsNullOrWhiteSpace(value)
        ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        : value.Split([',', ';', '\n'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => item.ToLowerInvariant())
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
}
