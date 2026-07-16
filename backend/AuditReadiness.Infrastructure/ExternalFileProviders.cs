using AuditReadiness.Application;

namespace AuditReadiness.Infrastructure;

public sealed class OneDriveFileProvider : IExternalFileProvider
{
    public bool Supports(string sourceProvider) => sourceProvider.Equals("OneDrive", StringComparison.OrdinalIgnoreCase);

    public Uri ValidateAndNormalize(string sourceUrl)
    {
        if (!Uri.TryCreate(sourceUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("A valid HTTPS OneDrive sharing URL is required.");
        return uri;
    }
}

public sealed class GenericExternalFileProvider : IExternalFileProvider
{
    public bool Supports(string sourceProvider) => !sourceProvider.Equals("OneDrive", StringComparison.OrdinalIgnoreCase);

    public Uri ValidateAndNormalize(string sourceUrl)
    {
        if (!Uri.TryCreate(sourceUrl, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("A valid HTTPS evidence URL is required.");
        return uri;
    }
}
