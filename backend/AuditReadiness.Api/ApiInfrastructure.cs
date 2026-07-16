using System.Security.Claims;
using AuditReadiness.Application;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuditReadiness.Api;

public sealed record ApiResponse<T>(bool Success, T? Data, string? Message, IReadOnlyList<string> Errors)
{
    public static ApiResponse<T> Ok(T data, string? message = null) => new(true, data, message, []);
}
public sealed record Pagination(int Page, int PageSize, int TotalItems, int TotalPages);
public sealed record PagedApiResponse<T>(bool Success, IReadOnlyList<T> Data, Pagination Pagination, string? Message, IReadOnlyList<string> Errors);

public static class ClaimsPrincipalExtensions
{
    public static UserContext ToUserContext(this ClaimsPrincipal principal)
    {
        var subject = principal.FindFirstValue("sub") ?? throw new UnauthorizedAccessException("JWT subject claim is missing.");
        if (!Guid.TryParse(subject, out var userId)) throw new UnauthorizedAccessException("JWT subject claim is invalid.");
        var roles = principal.FindAll("role").Select(x => x.Value).ToHashSet(StringComparer.OrdinalIgnoreCase);
        return new(userId, principal.FindFirstValue("email"), roles);
    }
}

public sealed class ApiExceptionHandler(ILogger<ApiExceptionHandler> logger, IHostEnvironment environment) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            NotFoundException => (404, "Resource not found"),
            ForbiddenException => (403, "Forbidden"),
            ConflictException or DbUpdateException => (409, "Conflict"),
            ArgumentException => (422, "Validation failed"),
            UnauthorizedAccessException => (401, "Unauthorized"),
            _ => (500, "An unexpected error occurred")
        };
        if (status >= 500) logger.LogError(exception, "Unhandled API exception for {Path}", httpContext.Request.Path);
        else logger.LogWarning("API request failed with {Status}: {Message}", status, exception.Message);
        var problem = new ProblemDetails { Status = status, Title = title, Detail = status == 500 && environment.IsProduction() ? "The server could not process the request." : exception.Message, Instance = httpContext.Request.Path };
        problem.Extensions["traceId"] = httpContext.TraceIdentifier;
        httpContext.Response.StatusCode = status;
        await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}

public static class ValidationProblemFactory
{
    public static IActionResult Create(ActionContext context)
    {
        var details = new ValidationProblemDetails(context.ModelState) { Status = 400, Title = "Request validation failed", Instance = context.HttpContext.Request.Path };
        details.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        return new BadRequestObjectResult(details);
    }
}
