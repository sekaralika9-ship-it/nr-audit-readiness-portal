using AuditReadiness.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

[ApiController, Route("api/v1/workspaces"), Authorize(Policy = "WorkspaceViewer")]
public sealed class WorkspacesController(IAuditService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WorkspaceDto>>>> List(CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<WorkspaceDto>>.Ok(await service.GetWorkspacesAsync(User.ToUserContext(), ct)));

    [HttpPost, Authorize(Policy = "WorkspaceEditor")]
    public async Task<ActionResult<ApiResponse<WorkspaceDto>>> Create(CreateWorkspaceRequest request, CancellationToken ct)
    {
        var result = await service.CreateWorkspaceAsync(request, User.ToUserContext(), ct);
        return CreatedAtAction(nameof(Get), new { workspaceId = result.Id }, ApiResponse<WorkspaceDto>.Ok(result, "Workspace created."));
    }

    [HttpGet("{workspaceId:guid}")]
    public async Task<ActionResult<ApiResponse<WorkspaceDto>>> Get(Guid workspaceId, CancellationToken ct) => Ok(ApiResponse<WorkspaceDto>.Ok(await service.GetWorkspaceAsync(workspaceId, User.ToUserContext(), ct)));

    [HttpPut("{workspaceId:guid}"), Authorize(Policy = "WorkspaceEditor")]
    public async Task<ActionResult<ApiResponse<WorkspaceDto>>> Update(Guid workspaceId, UpdateWorkspaceRequest request, CancellationToken ct) => Ok(ApiResponse<WorkspaceDto>.Ok(await service.UpdateWorkspaceAsync(workspaceId, request, User.ToUserContext(), ct), "Workspace updated."));

    [HttpPatch("{workspaceId:guid}/status"), Authorize(Policy = "WorkspaceEditor")]
    public async Task<ActionResult<ApiResponse<WorkspaceDto>>> Status(Guid workspaceId, UpdateWorkspaceStatusRequest request, CancellationToken ct) => Ok(ApiResponse<WorkspaceDto>.Ok(await service.UpdateWorkspaceStatusAsync(workspaceId, request, User.ToUserContext(), ct), "Workspace status updated."));

    [HttpDelete("{workspaceId:guid}"), Authorize(Policy = "WorkspaceEditor")]
    public async Task<IActionResult> Delete(Guid workspaceId, CancellationToken ct) { await service.DeleteWorkspaceAsync(workspaceId, User.ToUserContext(), ct); return NoContent(); }

    [HttpGet("{workspaceId:guid}/questions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<WorkspaceQuestionDto>>>> Questions(Guid workspaceId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<WorkspaceQuestionDto>>.Ok(await service.GetWorkspaceQuestionsAsync(workspaceId, User.ToUserContext(), ct)));

    [HttpGet("{workspaceId:guid}/report")]
    public async Task<ActionResult<ApiResponse<WorkspaceReportDto>>> Report(Guid workspaceId, CancellationToken ct) => Ok(ApiResponse<WorkspaceReportDto>.Ok(await service.GetReportAsync(workspaceId, User.ToUserContext(), ct)));

    [HttpGet("{workspaceId:guid}/activities")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ActivityDto>>>> Activities(Guid workspaceId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<ActivityDto>>.Ok(await service.GetActivitiesAsync(workspaceId, User.ToUserContext(), ct)));
}
