using AuditReadiness.Application;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace AuditReadiness.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration["DATABASE_CONNECTION_STRING"] ?? configuration.GetConnectionString("Database");
        if (string.IsNullOrWhiteSpace(connectionString))
            throw new InvalidOperationException("DATABASE_CONNECTION_STRING is required.");

        services.AddDbContext<AuditReadinessDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IAuditService, AuditService>();
        services.AddSingleton<IExternalFileProvider, OneDriveFileProvider>();
        services.AddSingleton<IExternalFileProvider, GenericExternalFileProvider>();
        return services;
    }
}
