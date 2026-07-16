using Microsoft.AspNetCore.Identity;

namespace AuditReadiness.Infrastructure;

public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = "";
    public string Function { get; set; } = "";
    public string? Department { get; set; }
    public string? EmployeeId { get; set; }
    public string? Phone { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}
