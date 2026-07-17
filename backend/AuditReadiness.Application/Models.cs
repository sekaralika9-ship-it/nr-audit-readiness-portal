using System.ComponentModel.DataAnnotations;
using AuditReadiness.Domain;

namespace AuditReadiness.Application;

public sealed record UserContext(Guid UserId, string? Email, IReadOnlySet<string> Roles)
{
    public bool IsAdministrator => Roles.Contains("administrator", StringComparer.OrdinalIgnoreCase) || Roles.Contains("admin", StringComparer.OrdinalIgnoreCase);
}

public sealed record MemberRequest(Guid UserId, [property: Required, MaxLength(200)] string UserName, [property: Required, EmailAddress] string UserEmail, WorkspaceMemberRole MemberRole);

public class CreateWorkspaceRequest : IValidatableObject
{
    [Required, StringLength(200, MinimumLength = 3)] public string WorkspaceName { get; init; } = "";
    public DateOnly AuditPeriodStart { get; init; }
    public DateOnly AuditPeriodEnd { get; init; }
    [Required, MaxLength(200)] public string AuditFunction { get; init; } = "";
    [MaxLength(250)] public string? AuditLocation { get; init; }
    [Required, MaxLength(50)] public string AuditeeId { get; init; } = "";
    [Required, MaxLength(200)] public string AuditeeName { get; init; } = "";
    public Guid? LeadAuditorId { get; init; }
    [MaxLength(200)] public string? LeadAuditorName { get; init; }
    [Required, MinLength(1)] public string[] SelectedIsoStandards { get; init; } = [];
    public WorkspaceStatus WorkspaceStatus { get; init; } = WorkspaceStatus.Draft;
    public List<MemberRequest> AuditorTeam { get; init; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (AuditPeriodEnd < AuditPeriodStart) yield return new("Audit period end must be on or after its start.", [nameof(AuditPeriodEnd)]);
        if (IsoStandards.Normalize(SelectedIsoStandards).Length == 0) yield return new("At least one supported ISO standard is required.", [nameof(SelectedIsoStandards)]);
    }
}

public sealed class UpdateWorkspaceRequest : CreateWorkspaceRequest
{
    public DateTimeOffset? ExpectedUpdatedAt { get; init; }
}

public sealed record UpdateWorkspaceStatusRequest(WorkspaceStatus WorkspaceStatus, DateTimeOffset? ExpectedUpdatedAt);

public sealed record WorkspaceMemberDto(Guid Id, Guid UserId, string UserName, string UserEmail, WorkspaceMemberRole MemberRole);
public sealed record WorkspaceDto(Guid Id, string WorkspaceName, DateOnly AuditPeriodStart, DateOnly AuditPeriodEnd, string AuditFunction, string? AuditLocation, string AuditeeId, string AuditeeName, Guid? LeadAuditorId, string? LeadAuditorName, string[] SelectedIsoStandards, WorkspaceStatus WorkspaceStatus, Guid CreatedBy, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt, IReadOnlyList<WorkspaceMemberDto> AuditorTeam);

public sealed record ThemeDto(string ThemeCode, string AuditTheme, string? AuditObjective, string? PrimaryFocus, string? ApplicableFunction, string? RelatedIsoStandards);
public sealed record QuestionDto(string QuestionKey, string ThemeCode, string? SystemDomain, string? Objective, string? ApplicableFunction, string? WhatToVerify, string AuditQuestion, string? RequiredEvidence, string? KpiReview, string? RiskReview, string[] IsoStandards, string? AuditorGuideline, string? EvidenceIndicator, string? QuestionCategory, string? ApplicableAuditee, string? Remarks);
public sealed record KeyQuestionDto(string QuestionKey, string? FunctionName, string? LocationName, string Section, string AuditQuestion, string? AuditType, string? Reference, string? AuditTrail, string? RequiredEvidence, string? SamplingGuide, IReadOnlyDictionary<string, string> IsoClauses, string[] IsoStandards, int DisplayOrder, string SourceDocument);
public sealed record WorkspaceQuestionDto(KeyQuestionDto Question, AssessmentDto? Assessment, int EvidenceCount, bool AssessmentCompleted);

public sealed class UpsertAssessmentRequest
{
    public AssessmentResult AssessmentResult { get; init; }
    [Required, RegularExpression("^(Not Started|In Progress|Ready|Needs Review)$")] public string ChecklistStatus { get; init; } = "Not Started";
    public bool ChecklistCompleted { get; init; }
    [MaxLength(5000)] public string? AuditorNotes { get; init; }
    [MaxLength(5000)] public string? AuditeeResponse { get; init; }
    [MaxLength(5000)] public string? CorrectiveAction { get; init; }
    [MaxLength(200)] public string? AssignedPerson { get; init; }
    public DateOnly? DueDate { get; init; }
    public Guid? ReviewedBy { get; init; }
    public DateTimeOffset? ReviewedAt { get; init; }
}

public sealed record AssessmentDto(Guid Id, Guid WorkspaceId, string QuestionKey, AssessmentResult AssessmentResult, string ChecklistStatus, bool ChecklistCompleted, string? AuditorNotes, string? AuditeeResponse, string? CorrectiveAction, string? AssignedPerson, DateOnly? DueDate, Guid? ReviewedBy, DateTimeOffset? ReviewedAt, Guid CreatedBy, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);

public sealed class EvidenceRequest
{
    [Required, MaxLength(50)] public string ThemeCode { get; init; } = "";
    [Required, MaxLength(50)] public string IsoStandard { get; init; } = "";
    [MaxLength(2000)] public string? EvidenceDescription { get; init; }
    [MaxLength(100)] public string? EvidenceCategory { get; init; }
    public EvidenceSourceProvider SourceProvider { get; init; } = EvidenceSourceProvider.OneDrive;
    [Required, Url, MaxLength(2048)] public string SourceUrl { get; init; } = "";
    [Url, MaxLength(2048)] public string? StorageUrl { get; init; }
    [MaxLength(255)] public string? FileName { get; init; }
    [MaxLength(150)] public string? MimeType { get; init; }
    [Range(0, long.MaxValue)] public long? FileSize { get; init; }
    [MaxLength(30)] public string Version { get; init; } = "1.0";
}

public sealed record EvidenceDto(Guid Id, Guid WorkspaceId, string QuestionKey, string ThemeCode, string IsoStandard, string? EvidenceDescription, string? EvidenceCategory, EvidenceSourceProvider SourceProvider, string SourceUrl, string? StorageUrl, string? FileName, string? MimeType, long? FileSize, string Version, Guid UploadedBy, DateTimeOffset CreatedAt, DateTimeOffset UpdatedAt);
public sealed record ActivityDto(Guid Id, Guid WorkspaceId, Guid UserId, string ActionType, string EntityType, string EntityId, string? OldValue, string? NewValue, DateTimeOffset CreatedAt);
public sealed record FindingGroupDto(string Key, int Ok, int Ofi, int Minor, int Major, int NotApplicable);
public sealed record QuestionEvidenceSummaryDto(string QuestionKey, int EvidenceCount);
public sealed record ReportQuestionDto(string QuestionKey, string Category, string QuestionText, string? FunctionName, string? LocationName, IReadOnlyDictionary<string, string> IsoClauses, AssessmentResult AssessmentResult, string? AuditorNotes, string? Recommendation, string? Pic, int EvidenceCount);
public sealed record WorkspaceReportDto(WorkspaceDto Workspace, int TotalQuestions, int AssessedQuestions, int OkCount, int OfiCount, int MinorCount, int MajorCount, int NotApplicableCount, decimal CompletionPercentage, IReadOnlyList<FindingGroupDto> FindingsByTheme, IReadOnlyList<FindingGroupDto> FindingsByIso, IReadOnlyList<QuestionEvidenceSummaryDto> EvidenceCountPerQuestion, IReadOnlyList<string> QuestionsWithoutEvidence, IReadOnlyList<string> QuestionsWithoutAssessment, IReadOnlyList<ReportQuestionDto> Questions);

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, int TotalItems)
{
    public int TotalPages => (int)Math.Ceiling(TotalItems / (double)PageSize);
}
