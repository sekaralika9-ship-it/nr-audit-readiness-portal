using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AuditReadiness.Infrastructure;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

namespace AuditReadiness.Api;

public sealed record PortalUserDto(Guid Id, string Email, string FullName, string Function, string? Department, string? EmployeeId, string? Phone, string[] Roles);
public sealed record AuthTokenDto(string AccessToken, DateTimeOffset ExpiresAt, PortalUserDto User);

public interface IJwtTokenService
{
    Task<AuthTokenDto> CreateAsync(ApplicationUser user);
}

public sealed class JwtTokenService(IConfiguration configuration, UserManager<ApplicationUser> userManager) : IJwtTokenService
{
    public async Task<AuthTokenDto> CreateAsync(ApplicationUser user)
    {
        var key = configuration["JWT_SIGNING_KEY"]
            ?? throw new InvalidOperationException("JWT_SIGNING_KEY is required.");
        if (Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("JWT_SIGNING_KEY must contain at least 32 bytes.");

        var issuer = configuration["JWT_ISSUER"] ?? "nr-audit-readiness-api";
        var audience = configuration["JWT_AUDIENCE"] ?? "nr-audit-readiness-portal";
        var expiresAt = DateTimeOffset.UtcNow.AddHours(8);
        var roles = (await userManager.GetRolesAsync(user)).ToArray();
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new("name", user.FullName),
            new("fungsi", user.Function)
        };
        claims.AddRange(roles.Select(role => new Claim("role", role)));

        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(issuer, audience, claims, expires: expiresAt.UtcDateTime, signingCredentials: credentials);
        var encoded = new JwtSecurityTokenHandler().WriteToken(token);
        return new(encoded, expiresAt, new(user.Id, user.Email ?? "", user.FullName, user.Function, user.Department, user.EmployeeId, user.Phone, roles));
    }
}
