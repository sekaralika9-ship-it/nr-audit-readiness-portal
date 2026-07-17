using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using AuditReadiness.Infrastructure;
using AuditReadiness.Api;
using AuditReadiness.Api.Controllers;
using FluentAssertions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.WebUtilities;
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
    public async Task RegisterAndLogin_IssuePortalJwtThatAllowsAuthMe()
    {
        var client = _factory.CreateClient();
        var email = $"auditor-{Guid.NewGuid():N}@example.com";
        var register = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            password = "AuditPortal123!",
            fullName = "API Test Auditor",
            function = "Internal Audit"
        });
        register.StatusCode.Should().Be(HttpStatusCode.OK, await register.Content.ReadAsStringAsync());

        var login = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email,
            password = "AuditPortal123!"
        });
        login.StatusCode.Should().Be(HttpStatusCode.OK);
        var authentication = await login.Content.ReadFromJsonAsync<ApiResponse<AuthTokenDto>>();
        authentication!.Data!.AccessToken.Should().NotBeNullOrWhiteSpace();

        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", authentication.Data.AccessToken);
        var response = await client.GetAsync("/api/v1/auth/me");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ForgotAndResetPassword_IssueSingleUseTokenAndAllowNewPassword()
    {
        var client = _factory.CreateClient();
        var email = $"password-reset-{Guid.NewGuid():N}@example.com";
        const string originalPassword = "AuditPortal123!";
        const string newPassword = "AuditPortal456!";
        var register = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            password = originalPassword,
            fullName = "Password Reset Test",
            function = "Internal Audit"
        });
        register.StatusCode.Should().Be(HttpStatusCode.OK);

        var forgot = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new { email });
        forgot.StatusCode.Should().Be(HttpStatusCode.OK, await forgot.Content.ReadAsStringAsync());
        var resetInstructions = await forgot.Content.ReadFromJsonAsync<ApiResponse<ForgotPasswordDto>>();
        resetInstructions!.Data!.DevelopmentResetUrl.Should().NotBeNullOrWhiteSpace();
        var resetUri = new Uri(resetInstructions.Data.DevelopmentResetUrl!);
        var resetQuery = QueryHelpers.ParseQuery(resetUri.Query);

        var reset = await client.PostAsJsonAsync("/api/v1/auth/reset-password", new
        {
            email = resetQuery["email"].ToString(),
            token = resetQuery["token"].ToString(),
            newPassword
        });
        reset.StatusCode.Should().Be(HttpStatusCode.OK, await reset.Content.ReadAsStringAsync());

        (await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = originalPassword }))
            .StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        (await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = newPassword }))
            .StatusCode.Should().Be(HttpStatusCode.OK);

        var reusedToken = await client.PostAsJsonAsync("/api/v1/auth/reset-password", new
        {
            email,
            token = resetQuery["token"].ToString(),
            newPassword = "AuditPortal789!"
        });
        reusedToken.StatusCode.Should().Be(HttpStatusCode.BadRequest);
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
    public const string Issuer = "nr-audit-readiness-api-tests";
    public const string Audience = "nr-audit-readiness-portal-tests";
    public const string Key = "test-signing-key-that-is-at-least-thirty-two-bytes-long";

    public AuditApiFactory()
    {
        Environment.SetEnvironmentVariable("DATABASE_CONNECTION_STRING", "Host=localhost;Database=test;Username=test;Password=test");
        Environment.SetEnvironmentVariable("JWT_ISSUER", Issuer);
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", Audience);
        Environment.SetEnvironmentVariable("JWT_SIGNING_KEY", Key);
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
