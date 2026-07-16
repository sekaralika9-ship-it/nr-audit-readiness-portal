using AuditReadiness.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

[ApiController, Route("api/v1/workspaces/{workspaceId:guid}"), Authorize(Policy = "Auditor")]
public sealed class AssessmentsController(IAuditService service) : ControllerBase
{
    [HttpGet("assessments")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<AssessmentDto>>>> List(Guid workspaceId, CancellationToken ct) => Ok(ApiResponse<IReadOnlyList<AssessmentDto>>.Ok(await service.GetAssessmentsAsync(workspaceId, User.ToUserContext(), ct)));

    [HttpGet("questions/{questionKey}/assessment")]
    public async Task<ActionResult<ApiResponse<AssessmentDto>>> Get(Guid workspaceId, string questionKey, CancellationToken ct)
    {
        var result = await service.GetAssessmentAsync(workspaceId, questionKey, User.ToUserContext(), ct);
        return result is null ? Problem(statusCode: 404, title: "Assessment not found") : Ok(ApiResponse<AssessmentDto>.Ok(result));
    }

    [HttpPut("questions/{questionKey}/assessment")]
    public async Task<ActionResult<ApiResponse<AssessmentDto>>> Upsert(Guid workspaceId, string questionKey, UpsertAssessmentRequest request, CancellationToken ct) => Ok(ApiResponse<AssessmentDto>.Ok(await service.UpsertAssessmentAsync(workspaceId, questionKey, request, User.ToUserContext(), ct), "Assessment saved."));
}
