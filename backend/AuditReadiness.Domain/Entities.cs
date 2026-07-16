namespace AuditReadiness.Domain;

public sealed class AuditWorkspace
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string WorkspaceName { get; set; }
    public DateOnly AuditPeriodStart { get; set; }
    public DateOnly AuditPeriodEnd { get; set; }
    public required string AuditFunction { get; set; }
    public required string AuditeeId { get; set; }
    public required string AuditeeName { get; set; }
    public Guid? LeadAuditorId { get; set; }
    public string? LeadAuditorName { get; set; }
    public string[] SelectedIsoStandards { get; set; } = [];
    public WorkspaceStatus WorkspaceStatus { get; set; } = WorkspaceStatus.Draft;
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsDeleted { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public ICollection<AuditWorkspaceMember> Members { get; set; } = [];
    public ICollection<AuditQuestionAssessment> Assessments { get; set; } = [];
    public ICollection<AuditEvidence> Evidence { get; set; } = [];
}

public sealed class AuditWorkspaceMember
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkspaceId { get; set; }
    public AuditWorkspace Workspace { get; set; } = null!;
    public Guid UserId { get; set; }
    public required string UserName { get; set; }
    public required string UserEmail { get; set; }
    public WorkspaceMemberRole MemberRole { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditQuestionAssessment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkspaceId { get; set; }
    public AuditWorkspace Workspace { get; set; } = null!;
    public required string QuestionKey { get; set; }
    public AssessmentResult AssessmentResult { get; set; } = AssessmentResult.NotAssessed;
    public string ChecklistStatus { get; set; } = "Not Started";
    public bool ChecklistCompleted { get; set; }
    public string? AuditorNotes { get; set; }
    public string? AuditeeResponse { get; set; }
    public string? CorrectiveAction { get; set; }
    public string? AssignedPerson { get; set; }
    public DateOnly? DueDate { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditEvidence
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkspaceId { get; set; }
    public AuditWorkspace Workspace { get; set; } = null!;
    public required string QuestionKey { get; set; }
    public required string ThemeCode { get; set; }
    public required string IsoStandard { get; set; }
    public string? EvidenceDescription { get; set; }
    public string? EvidenceCategory { get; set; }
    public EvidenceSourceProvider SourceProvider { get; set; }
    public required string SourceUrl { get; set; }
    public string? StorageUrl { get; set; }
    public string? FileName { get; set; }
    public string? MimeType { get; set; }
    public long? FileSize { get; set; }
    public string Version { get; set; } = "1.0";
    public Guid UploadedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkspaceId { get; set; }
    public AuditWorkspace Workspace { get; set; } = null!;
    public Guid UserId { get; set; }
    public required string ActionType { get; set; }
    public required string EntityType { get; set; }
    public required string EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditMasterTheme
{
    public required string ThemeId { get; set; }
    public required string AuditTheme { get; set; }
    public string? AuditObjective { get; set; }
    public string? PrimaryFocus { get; set; }
    public string? ApplicableFunction { get; set; }
    public string? RelatedIsoStandards { get; set; }
    public DateTimeOffset? CreatedAt { get; set; }
}

public sealed class AuditDocument
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Function { get; set; }
    public string? FilePath { get; set; }
    public string? FileName { get; set; }
    public string? FileType { get; set; }
    public long? FileSize { get; set; }
    public required string Status { get; set; }
    public Guid UploadedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class AuditMasterQuestion
{
    public required string QuestionKey { get; set; }
    public required string ThemeCode { get; set; }
    public string? SystemDomain { get; set; }
    public string? Objective { get; set; }
    public string? ApplicableFunction { get; set; }
    public string? WhatToVerify { get; set; }
    public required string AuditQuestion { get; set; }
    public string? Evidence { get; set; }
    public string? KpiReview { get; set; }
    public string? RiskReview { get; set; }
    public string? Iso9001 { get; set; }
    public string? Iso14001 { get; set; }
    public string? Iso45001 { get; set; }
    public string? Iso37001 { get; set; }
    public string? Iso22301 { get; set; }
    public string? AuditorGuideline { get; set; }
    public string? EvidenceIndicator { get; set; }
    public string? QuestionCategory { get; set; }
    public string? ApplicableAuditee { get; set; }
    public string? Remarks { get; set; }
    public DateTimeOffset? CreatedAt { get; set; }
}
