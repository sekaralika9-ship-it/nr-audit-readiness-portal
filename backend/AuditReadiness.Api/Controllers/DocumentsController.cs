using System.ComponentModel.DataAnnotations;
using AuditReadiness.Application;
using AuditReadiness.Domain;
using AuditReadiness.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuditReadiness.Api.Controllers;

public sealed class DocumentRequest
{
    [Required, MaxLength(250)] public string Title { get; init; } = "";
    [MaxLength(2000)] public string? Description { get; init; }
    [MaxLength(100)] public string? Category { get; init; }
    [MaxLength(200)] public string? Function { get; init; }
    [MaxLength(2048)] public string? FilePath { get; init; }
    [MaxLength(255)] public string? FileName { get; init; }
    [MaxLength(150)] public string? FileType { get; init; }
    [Range(0, long.MaxValue)] public long? FileSize { get; init; }
    [Required, MaxLength(50)] public string Status { get; init; } = "Draft";
}

public sealed record DocumentDto(Guid Id, Guid UserId, string Title, string? Description, string? Category, string? Function, string? FilePath, string? FileName, string? FileType, long? FileSize, string Status, Guid UploadedBy, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

[ApiController, Route("api/v1/documents"), Authorize]
public sealed class DocumentsController(AuditReadinessDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<DocumentDto>>>> List(CancellationToken ct)
    {
        var user = User.ToUserContext();
        var query = db.Documents.AsNoTracking();
        if (!user.IsAdministrator) query = query.Where(x => x.UserId == user.UserId);
        var rows = await query.OrderByDescending(x => x.CreatedAt).ToListAsync(ct);
        return Ok(ApiResponse<IReadOnlyList<DocumentDto>>.Ok(rows.Select(ToDto).ToList()));
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> Create(DocumentRequest request, CancellationToken ct)
    {
        var userId = User.ToUserContext().UserId;
        var row = new AuditDocument { UserId = userId, UploadedBy = userId, Title = request.Title.Trim(), Status = request.Status.Trim() };
        Apply(row, request);
        db.Documents.Add(row);
        await db.SaveChangesAsync(ct);
        return CreatedAtAction(nameof(List), ApiResponse<DocumentDto>.Ok(ToDto(row), "Document created."));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ApiResponse<DocumentDto>>> Update(Guid id, DocumentRequest request, CancellationToken ct)
    {
        var row = await AuthorizedDocumentAsync(id, ct);
        Apply(row, request);
        row.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Ok(ApiResponse<DocumentDto>.Ok(ToDto(row), "Document updated."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken ct)
    {
        db.Documents.Remove(await AuthorizedDocumentAsync(id, ct));
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    private async Task<AuditDocument> AuthorizedDocumentAsync(Guid id, CancellationToken ct)
    {
        var row = await db.Documents.SingleOrDefaultAsync(x => x.Id == id, ct) ?? throw new NotFoundException("Document was not found.");
        var user = User.ToUserContext();
        if (!user.IsAdministrator && row.UserId != user.UserId) throw new ForbiddenException("You cannot modify this document.");
        return row;
    }

    private static void Apply(AuditDocument row, DocumentRequest request)
    {
        row.Title = request.Title.Trim();
        row.Description = Clean(request.Description);
        row.Category = Clean(request.Category);
        row.Function = Clean(request.Function);
        row.FilePath = Clean(request.FilePath);
        row.FileName = Clean(request.FileName);
        row.FileType = Clean(request.FileType);
        row.FileSize = request.FileSize;
        row.Status = request.Status.Trim();
    }
    private static string? Clean(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static DocumentDto ToDto(AuditDocument x) => new(x.Id, x.UserId, x.Title, x.Description, x.Category, x.Function, x.FilePath, x.FileName, x.FileType, x.FileSize, x.Status, x.UploadedBy, x.CreatedAt, x.UpdatedAt);
}
