using Microsoft.Extensions.Configuration;
using Npgsql;

namespace AuditReadiness.Infrastructure;

public static class DatabaseConnection
{
    public static string Resolve(IConfiguration configuration)
    {
        var value = configuration["DATABASE_CONNECTION_STRING"]
            ?? configuration["DATABASE_URL"]
            ?? configuration.GetConnectionString("Database");
        if (string.IsNullOrWhiteSpace(value))
            throw new InvalidOperationException("DATABASE_CONNECTION_STRING is required.");

        if (!Uri.TryCreate(value, UriKind.Absolute, out var uri)
            || (uri.Scheme != "postgres" && uri.Scheme != "postgresql"))
            return value;

        var credentials = uri.UserInfo.Split(':', 2);
        if (credentials.Length != 2)
            throw new InvalidOperationException("The PostgreSQL URL must contain a username and password.");

        return new NpgsqlConnectionStringBuilder
        {
            Host = uri.Host,
            Port = uri.IsDefaultPort ? 5432 : uri.Port,
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            Username = Uri.UnescapeDataString(credentials[0]),
            Password = Uri.UnescapeDataString(credentials[1]),
            SslMode = SslMode.Prefer
        }.ConnectionString;
    }
}
