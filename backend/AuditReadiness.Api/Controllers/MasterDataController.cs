using AuditReadiness.Application;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditReadiness.Api.Controllers;

[ApiController, Authorize, Route("api/v1")]
public sealed class MasterDataController(IAuditService service) : ControllerBase
{
    [HttpGet("themes")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<ThemeDto>>>> Themes(CancellationToken cancellationToken) => Ok(ApiResponse<IReadOnlyList<ThemeDto>>.Ok(await service.GetThemesAsync(cancellationToken)));

    [HttpGet("themes/{themeCode}")]
    public async Task<ActionResult<ApiResponse<ThemeDto>>> Theme(string themeCode, CancellationToken cancellationToken)
    {
        var result = await service.GetThemeAsync(themeCode, cancellationToken);
        return result is null ? Problem(statusCode: 404, title: "Theme not found") : Ok(ApiResponse<ThemeDto>.Ok(result));
    }

    [HttpGet("questions")]
    public async Task<ActionResult<PagedApiResponse<QuestionDto>>> Questions([FromQuery] string? themeCode, [FromQuery(Name = "function")] string? functionName, [FromQuery] string? isoStandard, [FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await service.GetQuestionsAsync(themeCode, functionName, isoStandard, search, page, pageSize, cancellationToken);
        return Ok(new PagedApiResponse<QuestionDto>(true, result.Items, new(result.Page, result.PageSize, result.TotalItems, result.TotalPages), null, []));
    }

    [HttpGet("questions/{questionKey}")]
    public async Task<ActionResult<ApiResponse<QuestionDto>>> Question(string questionKey, CancellationToken cancellationToken)
    {
        var result = await service.GetQuestionAsync(questionKey, cancellationToken);
        return result is null ? Problem(statusCode: 404, title: "Question not found") : Ok(ApiResponse<QuestionDto>.Ok(result));
    }

    [HttpGet("key-questions")]
    public async Task<ActionResult<ApiResponse<IReadOnlyList<KeyQuestionDto>>>> KeyQuestions(
        [FromQuery(Name = "function")] string? functionName, [FromQuery] string? auditee, [FromQuery] string? location,
        [FromQuery] string? category, [FromQuery] string? section, [FromQuery] string? isoStandard,
        [FromQuery] string[]? isoStandards, [FromQuery] Guid? workspaceId, CancellationToken cancellationToken)
    {
        if (workspaceId.HasValue)
        {
            var workspaceQuestions = await service.GetWorkspaceQuestionsAsync(workspaceId.Value, User.ToUserContext(), cancellationToken);
            return Ok(ApiResponse<IReadOnlyList<KeyQuestionDto>>.Ok(workspaceQuestions.Select(x => x.Question).ToList()));
        }
        var selectedIso = isoStandard ?? isoStandards?.FirstOrDefault();
        return Ok(ApiResponse<IReadOnlyList<KeyQuestionDto>>.Ok(await service.GetKeyQuestionsAsync(functionName ?? auditee, location, section ?? category, selectedIso, cancellationToken)));
    }
}
