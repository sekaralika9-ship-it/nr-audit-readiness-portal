namespace AuditReadiness.Application;

public interface IAuditService
{
    Task<IReadOnlyList<ThemeDto>> GetThemesAsync(CancellationToken cancellationToken);
    Task<ThemeDto?> GetThemeAsync(string themeCode, CancellationToken cancellationToken);
    Task<PagedResult<QuestionDto>> GetQuestionsAsync(string? themeCode, string? function, string? isoStandard, string? search, int page, int pageSize, CancellationToken cancellationToken);
    Task<QuestionDto?> GetQuestionAsync(string questionKey, CancellationToken cancellationToken);
    Task<IReadOnlyList<KeyQuestionDto>> GetKeyQuestionsAsync(string? function, string? location, string? section, string? isoStandard, CancellationToken cancellationToken);
    Task<IReadOnlyList<WorkspaceDto>> GetWorkspacesAsync(UserContext user, CancellationToken cancellationToken);
    Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceRequest request, UserContext user, CancellationToken cancellationToken);
    Task<WorkspaceDto> GetWorkspaceAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
    Task<WorkspaceDto> UpdateWorkspaceAsync(Guid workspaceId, UpdateWorkspaceRequest request, UserContext user, CancellationToken cancellationToken);
    Task<WorkspaceDto> UpdateWorkspaceStatusAsync(Guid workspaceId, UpdateWorkspaceStatusRequest request, UserContext user, CancellationToken cancellationToken);
    Task DeleteWorkspaceAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
    Task<IReadOnlyList<WorkspaceQuestionDto>> GetWorkspaceQuestionsAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
    Task<IReadOnlyList<AssessmentDto>> GetAssessmentsAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
    Task<AssessmentDto?> GetAssessmentAsync(Guid workspaceId, string questionKey, UserContext user, CancellationToken cancellationToken);
    Task<AssessmentDto> UpsertAssessmentAsync(Guid workspaceId, string questionKey, UpsertAssessmentRequest request, UserContext user, CancellationToken cancellationToken);
    Task<IReadOnlyList<EvidenceDto>> GetEvidenceAsync(Guid workspaceId, string questionKey, UserContext user, CancellationToken cancellationToken);
    Task<EvidenceDto> AddEvidenceAsync(Guid workspaceId, string questionKey, EvidenceRequest request, UserContext user, CancellationToken cancellationToken);
    Task<EvidenceDto> UpdateEvidenceAsync(Guid workspaceId, string questionKey, Guid evidenceId, EvidenceRequest request, UserContext user, CancellationToken cancellationToken);
    Task DeleteEvidenceAsync(Guid workspaceId, string questionKey, Guid evidenceId, UserContext user, CancellationToken cancellationToken);
    Task<WorkspaceReportDto> GetReportAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
    Task<IReadOnlyList<ActivityDto>> GetActivitiesAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken);
}

public interface IExternalFileProvider
{
    bool Supports(string sourceProvider);
    Uri ValidateAndNormalize(string sourceUrl);
}

public class NotFoundException(string message) : Exception(message);
public class ForbiddenException(string message) : Exception(message);
public class ConflictException(string message) : Exception(message);
