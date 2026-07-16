using AuditReadiness.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

[ApiController, Route("api/v1/workspaces/{workspaceId:guid}/questions/{questionKey}/evidence"), Authorize(Policy = "WorkspaceViewer")]
public sealed class EvidenceController(IAuditService service) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<EvidenceDto>>>> List(Guid workspaceId, string questionKey, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<EvidenceDto>>.Ok(await service.GetEvidenceAsync(workspaceId, questionKey, User.ToUserContext(), ct)));

    [HttpPost, Authorize(Policy = "WorkspaceEditor")]
    public async Task<ActionResult<ApiResponse<EvidenceDto>>> Create(Guid workspaceId, string questionKey, EvidenceRequest request, CancellationToken ct)
    {
        var result = await service.AddEvidenceAsync(workspaceId, questionKey, request, User.ToUserContext(), ct);
        return CreatedAtAction(nameof(List), new { workspaceId, questionKey }, ApiResponse<EvidenceDto>.Ok(result, "Evidence added."));
    }

    [HttpPut("{evidenceId:guid}"), Authorize(Policy = "WorkspaceEditor")]
    public async Task<ActionResult<ApiResponse<EvidenceDto>>> Update(Guid workspaceId, string questionKey, Guid evidenceId, EvidenceRequest request, CancellationToken ct) => Ok(ApiResponse<EvidenceDto>.Ok(await service.UpdateEvidenceAsync(workspaceId, questionKey, evidenceId, request, User.ToUserContext(), ct), "Evidence updated."));

    [HttpDelete("{evidenceId:guid}"), Authorize(Policy = "WorkspaceEditor")]
    public async Task<IActionResult> Delete(Guid workspaceId, string questionKey, Guid evidenceId, CancellationToken ct) { await service.DeleteEvidenceAsync(workspaceId, questionKey, evidenceId, User.ToUserContext(), ct); return NoContent(); }
}
