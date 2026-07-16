using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using AuditReadiness.Infrastructure;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Tokens;

namespace AuditReadiness.Tests;

public sealed class ApiSecurityTests : IClassFixture<AuditApiFactory>
{
    private readonly AuditApiFactory _factory;
    public ApiSecurityTests(AuditApiFactory factory) => _factory = factory;

    [Fact]
    public async Task ProtectedEndpoint_RejectsMissingJwt()
    {
        var response = await _factory.CreateClient().GetAsync("/api/v1/workspaces");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task SupabaseStyleJwt_AllowsAuthMe()
    {
        var client = AuthenticatedClient();
        var response = await client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task InvalidWorkspaceRequest_ReturnsValidationProblemDetails()
    {
        var response = await AuthenticatedClient().PostAsJsonAsync("/api/v1/workspaces", new
        {
            workspaceName = "x", auditPeriodStart = "2026-09-30", auditPeriodEnd = "2026-07-01", auditFunction = "", auditeeId = "", auditeeName = "", selectedIsoStandards = Array.Empty<string>()
        });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/problem+json");
    }

    private HttpClient AuthenticatedClient()
    {
        var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", AuditApiFactory.CreateToken());
        return client;
    }
}

public sealed class AuditApiFactory : WebApplicationFactory<Program>
{
    public const string Issuer = "https://test.supabase.co/auth/v1";
    public const string Audience = "authenticated";
    public const string Key = "test-signing-key-that-is-at-least-thirty-two-bytes-long";

    public AuditApiFactory()
    {
        Environment.SetEnvironmentVariable("DATABASE_CONNECTION_STRING", "Host=localhost;Database=test;Username=test;Password=test");
        Environment.SetEnvironmentVariable("SUPABASE_JWT_ISSUER", Issuer);
        Environment.SetEnvironmentVariable("SUPABASE_JWT_AUDIENCE", Audience);
        Environment.SetEnvironmentVariable("SUPABASE_JWT_KEY", Key);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AuditReadinessDbContext>>();
            services.RemoveAll<AuditReadinessDbContext>();
            services.AddDbContext<AuditReadinessDbContext>(options => options.UseInMemoryDatabase("api-tests"));
        });
    }

    public static string CreateToken()
    {
        var credentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key)), SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(Issuer, Audience, [new Claim("sub", "11111111-1111-1111-1111-111111111111"), new Claim("email", "auditor@example.com"), new Claim("role", "authenticated")], expires: DateTime.UtcNow.AddMinutes(10), signingCredentials: credentials);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
