using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace AuditReadiness.Infrastructure;

public sealed class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AuditReadinessDbContext>
{
    public AuditReadinessDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("DATABASE_CONNECTION_STRING");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException(
                "DATABASE_CONNECTION_STRING is required for EF Core database commands.");
        var options = new DbContextOptionsBuilder<AuditReadinessDbContext>().UseNpgsql(connectionString).Options;
        return new(options);
    }
}
