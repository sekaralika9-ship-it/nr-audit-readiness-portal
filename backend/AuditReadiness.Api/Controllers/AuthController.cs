using System.ComponentModel.DataAnnotations;
using AuditReadiness.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

public sealed record LoginRequest([Required, EmailAddress] string Email, [Required] string Password);
public sealed record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(10)] string Password,
    [Required, MaxLength(200)] string FullName,
    [Required, MaxLength(200)] string Function);
public sealed record UpdateProfileRequest(
    [Required, MaxLength(200)] string FullName,
    [Required, MaxLength(200)] string Function,
    [MaxLength(200)] string? Department,
    [MaxLength(100)] string? EmployeeId,
    [MaxLength(50)] string? Phone);

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<Guid>> roleManager,
    IJwtTokenService tokenService) : ControllerBase
{
    [HttpPost("register"), AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokenDto>>> Register(RegisterRequest request)
    {
        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email.Trim().ToLowerInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            FullName = request.FullName.Trim(),
            Function = request.Function.Trim(),
            EmailConfirmed = true
        };
        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
            return ValidationProblem(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["registration"] = result.Errors.Select(x => x.Description).ToArray()
            }));

        if (!await roleManager.RoleExistsAsync("auditor"))
            await roleManager.CreateAsync(new IdentityRole<Guid>("auditor"));
        await userManager.AddToRoleAsync(user, "auditor");
        return Ok(ApiResponse<AuthTokenDto>.Ok(await tokenService.CreateAsync(user), "Account created."));
    }

    [HttpPost("login"), AllowAnonymous]
    public async Task<ActionResult<ApiResponse<AuthTokenDto>>> Login(LoginRequest request)
    {
        var user = await userManager.FindByEmailAsync(request.Email.Trim());
        if (user is null) return Unauthorized(new ProblemDetails { Status = 401, Title = "Invalid email or password." });
        if (await userManager.IsLockedOutAsync(user))
            return StatusCode(423, new ProblemDetails { Status = 423, Title = "Account temporarily locked." });
        if (!await userManager.CheckPasswordAsync(user, request.Password))
        {
            await userManager.AccessFailedAsync(user);
            return Unauthorized(new ProblemDetails { Status = 401, Title = "Invalid email or password." });
        }
        await userManager.ResetAccessFailedCountAsync(user);
        return Ok(ApiResponse<AuthTokenDto>.Ok(await tokenService.CreateAsync(user)));
    }

    [HttpGet("me"), Authorize]
    public async Task<ActionResult<ApiResponse<PortalUserDto>>> Me()
    {
        var user = await CurrentUserAsync();
        var token = await tokenService.CreateAsync(user);
        return Ok(ApiResponse<PortalUserDto>.Ok(token.User));
    }

    [HttpPut("me"), Authorize]
    public async Task<ActionResult<ApiResponse<PortalUserDto>>> UpdateMe(UpdateProfileRequest request)
    {
        var user = await CurrentUserAsync();
        user.FullName = request.FullName.Trim();
        user.Function = request.Function.Trim();
        user.Department = Clean(request.Department);
        user.EmployeeId = Clean(request.EmployeeId);
        user.Phone = Clean(request.Phone);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded) throw new InvalidOperationException(string.Join(" ", result.Errors.Select(x => x.Description)));
        return Ok(ApiResponse<PortalUserDto>.Ok((await tokenService.CreateAsync(user)).User, "Profile updated."));
    }

    private async Task<ApplicationUser> CurrentUserAsync()
    {
        var id = User.ToUserContext().UserId;
        return await userManager.FindByIdAsync(id.ToString()) ?? throw new UnauthorizedAccessException("User account no longer exists.");
    }

    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
