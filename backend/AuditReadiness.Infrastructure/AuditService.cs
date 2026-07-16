using System.Text.Json;
using AuditReadiness.Application;
using AuditReadiness.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuditReadiness.Infrastructure;

public sealed class AuditService(AuditReadinessDbContext db, IEnumerable<IExternalFileProvider> fileProviders) : IAuditService
{
    private const int MaximumPageSize = 100;

    public async Task<IReadOnlyList<ThemeDto>> GetThemesAsync(CancellationToken cancellationToken) =>
        await MasterThemes().OrderBy(x => x.ThemeId)
            .Select(x => new ThemeDto(x.ThemeId, x.AuditTheme, x.AuditObjective, x.PrimaryFocus, x.ApplicableFunction, x.RelatedIsoStandards))
            .ToListAsync(cancellationToken);

    public async Task<ThemeDto?> GetThemeAsync(string themeCode, CancellationToken cancellationToken)
    {
        var normalized = themeCode.Trim().ToUpperInvariant();
        return await MasterThemes().Where(x => x.ThemeId.ToUpper() == normalized)
            .Select(x => new ThemeDto(x.ThemeId, x.AuditTheme, x.AuditObjective, x.PrimaryFocus, x.ApplicableFunction, x.RelatedIsoStandards))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<PagedResult<QuestionDto>> GetQuestionsAsync(string? themeCode, string? function, string? isoStandard, string? search, int page, int pageSize, CancellationToken cancellationToken)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, MaximumPageSize);
        var items = (await MasterQuestions().ToListAsync(cancellationToken)).Select(ToQuestion).AsEnumerable();
        if (!string.IsNullOrWhiteSpace(themeCode)) items = items.Where(x => x.ThemeCode.Equals(themeCode.Trim(), StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(function)) items = items.Where(x => (x.ApplicableFunction ?? "").Contains(function.Trim(), StringComparison.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(isoStandard) && !isoStandard.Equals("All ISO", StringComparison.OrdinalIgnoreCase))
            items = items.Where(x => x.IsoStandards.Contains(isoStandard.Trim(), StringComparer.OrdinalIgnoreCase));
        if (!string.IsNullOrWhiteSpace(search))
            items = items.Where(x => $"{x.QuestionKey} {x.AuditQuestion} {x.Objective} {x.RequiredEvidence}".Contains(search.Trim(), StringComparison.OrdinalIgnoreCase));
        var materialized = items.OrderBy(x => x.ThemeCode).ThenBy(x => x.QuestionKey).ToList();
        return new(materialized.Skip((page - 1) * pageSize).Take(pageSize).ToList(), page, pageSize, materialized.Count);
    }

    public async Task<QuestionDto?> GetQuestionAsync(string questionKey, CancellationToken cancellationToken)
    {
        var row = await MasterQuestions().SingleOrDefaultAsync(x => x.QuestionKey == questionKey, cancellationToken);
        return row is null ? null : ToQuestion(row);
    }

    public async Task<IReadOnlyList<WorkspaceDto>> GetWorkspacesAsync(UserContext user, CancellationToken cancellationToken)
    {
        var query = db.Workspaces.AsNoTracking().Include(x => x.Members).AsQueryable();
        if (!user.IsAdministrator) query = query.Where(x => x.CreatedBy == user.UserId || x.Members.Any(m => m.UserId == user.UserId));
        return (await query.OrderByDescending(x => x.UpdatedAt).ToListAsync(cancellationToken)).Select(ToWorkspace).ToList();
    }

    public async Task<WorkspaceDto> CreateWorkspaceAsync(CreateWorkspaceRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var workspace = new AuditWorkspace
        {
            WorkspaceName = Clean(request.WorkspaceName), AuditPeriodStart = request.AuditPeriodStart, AuditPeriodEnd = request.AuditPeriodEnd,
            AuditFunction = Clean(request.AuditFunction), AuditeeId = Clean(request.AuditeeId), AuditeeName = Clean(request.AuditeeName),
            LeadAuditorId = request.LeadAuditorId, LeadAuditorName = CleanNullable(request.LeadAuditorName),
            SelectedIsoStandards = NormalizeIso(request.SelectedIsoStandards), WorkspaceStatus = request.WorkspaceStatus,
            CreatedBy = user.UserId, CreatedAt = now, UpdatedAt = now,
            Members = request.AuditorTeam.GroupBy(x => x.UserId).Select(x => x.First()).Select(ToMember).ToList()
        };
        db.Workspaces.Add(workspace);
        AddActivity(workspace.Id, user.UserId, "WORKSPACE_CREATED", "Workspace", workspace.Id.ToString(), null, request);
        await db.SaveChangesAsync(cancellationToken);
        return ToWorkspace(workspace);
    }

    public async Task<WorkspaceDto> GetWorkspaceAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken) =>
        ToWorkspace(await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken));

    public async Task<WorkspaceDto> UpdateWorkspaceAsync(Guid workspaceId, UpdateWorkspaceRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        CheckConcurrency(workspace, request.ExpectedUpdatedAt);
        var old = ToWorkspace(workspace);
        workspace.WorkspaceName = Clean(request.WorkspaceName);
        workspace.AuditPeriodStart = request.AuditPeriodStart;
        workspace.AuditPeriodEnd = request.AuditPeriodEnd;
        workspace.AuditFunction = Clean(request.AuditFunction);
        workspace.AuditeeId = Clean(request.AuditeeId);
        workspace.AuditeeName = Clean(request.AuditeeName);
        workspace.LeadAuditorId = request.LeadAuditorId;
        workspace.LeadAuditorName = CleanNullable(request.LeadAuditorName);
        workspace.SelectedIsoStandards = NormalizeIso(request.SelectedIsoStandards);
        workspace.WorkspaceStatus = request.WorkspaceStatus;
        workspace.UpdatedAt = DateTimeOffset.UtcNow;
        db.WorkspaceMembers.RemoveRange(workspace.Members);
        workspace.Members = request.AuditorTeam.GroupBy(x => x.UserId).Select(x => x.First()).Select(ToMember).ToList();
        AddActivity(workspace.Id, user.UserId, "WORKSPACE_UPDATED", "Workspace", workspace.Id.ToString(), old, request);
        await db.SaveChangesAsync(cancellationToken);
        return ToWorkspace(workspace);
    }

    public async Task<WorkspaceDto> UpdateWorkspaceStatusAsync(Guid workspaceId, UpdateWorkspaceStatusRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        CheckConcurrency(workspace, request.ExpectedUpdatedAt);
        var oldStatus = workspace.WorkspaceStatus;
        workspace.WorkspaceStatus = request.WorkspaceStatus;
        workspace.UpdatedAt = DateTimeOffset.UtcNow;
        AddActivity(workspace.Id, user.UserId, "WORKSPACE_STATUS_UPDATED", "Workspace", workspace.Id.ToString(), oldStatus, request.WorkspaceStatus);
        await db.SaveChangesAsync(cancellationToken);
        return ToWorkspace(workspace);
    }

    public async Task DeleteWorkspaceAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        workspace.IsDeleted = true;
        workspace.DeletedAt = workspace.UpdatedAt = DateTimeOffset.UtcNow;
        AddActivity(workspace.Id, user.UserId, "WORKSPACE_DELETED", "Workspace", workspace.Id.ToString(), ToWorkspace(workspace), null);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WorkspaceQuestionDto>> GetWorkspaceQuestionsAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        var questions = await QuestionsForWorkspaceAsync(workspace, cancellationToken);
        var assessments = await db.Assessments.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).ToDictionaryAsync(x => x.QuestionKey, cancellationToken);
        var evidenceCounts = (await db.Evidence.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).Select(x => x.QuestionKey).ToListAsync(cancellationToken))
            .GroupBy(x => x).ToDictionary(x => x.Key, x => x.Count());
        return questions.Select(question =>
        {
            assessments.TryGetValue(question.QuestionKey, out var assessment);
            return new WorkspaceQuestionDto(question, assessment is null ? null : ToAssessment(assessment), evidenceCounts.GetValueOrDefault(question.QuestionKey), assessment?.ChecklistCompleted == true || assessment?.AssessmentResult != AssessmentResult.NotAssessed);
        }).ToList();
    }

    public async Task<IReadOnlyList<AssessmentDto>> GetAssessmentsAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken)
    {
        await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        return (await db.Assessments.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).OrderBy(x => x.QuestionKey).ToListAsync(cancellationToken)).Select(ToAssessment).ToList();
    }

    public async Task<AssessmentDto?> GetAssessmentAsync(Guid workspaceId, string questionKey, UserContext user, CancellationToken cancellationToken)
    {
        await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        var item = await db.Assessments.AsNoTracking().SingleOrDefaultAsync(x => x.WorkspaceId == workspaceId && x.QuestionKey == questionKey, cancellationToken);
        return item is null ? null : ToAssessment(item);
    }

    public async Task<AssessmentDto> UpsertAssessmentAsync(Guid workspaceId, string questionKey, UpsertAssessmentRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        await EnsureQuestionAsync(workspace, questionKey, cancellationToken);
        var item = await db.Assessments.SingleOrDefaultAsync(x => x.WorkspaceId == workspaceId && x.QuestionKey == questionKey, cancellationToken);
        var old = item is null ? null : ToAssessment(item);
        if (item is null)
        {
            item = new AuditQuestionAssessment { WorkspaceId = workspaceId, QuestionKey = questionKey, CreatedBy = user.UserId };
            db.Assessments.Add(item);
        }
        item.AssessmentResult = request.AssessmentResult;
        item.ChecklistStatus = Clean(request.ChecklistStatus);
        item.ChecklistCompleted = request.ChecklistCompleted;
        item.AuditorNotes = CleanNullable(request.AuditorNotes);
        item.AuditeeResponse = CleanNullable(request.AuditeeResponse);
        item.CorrectiveAction = CleanNullable(request.CorrectiveAction);
        item.AssignedPerson = CleanNullable(request.AssignedPerson);
        item.DueDate = request.DueDate;
        item.ReviewedBy = request.ReviewedBy;
        item.ReviewedAt = request.ReviewedAt?.ToUniversalTime();
        item.UpdatedAt = DateTimeOffset.UtcNow;
        AddActivity(workspaceId, user.UserId, old is null ? "ASSESSMENT_CREATED" : "ASSESSMENT_UPDATED", "Assessment", questionKey, old, request);
        await db.SaveChangesAsync(cancellationToken);
        return ToAssessment(item);
    }

    public async Task<IReadOnlyList<EvidenceDto>> GetEvidenceAsync(Guid workspaceId, string questionKey, UserContext user, CancellationToken cancellationToken)
    {
        await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        return (await db.Evidence.AsNoTracking().Where(x => x.WorkspaceId == workspaceId && x.QuestionKey == questionKey).OrderByDescending(x => x.CreatedAt).ToListAsync(cancellationToken)).Select(ToEvidence).ToList();
    }

    public async Task<EvidenceDto> AddEvidenceAsync(Guid workspaceId, string questionKey, EvidenceRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        await EnsureQuestionAsync(workspace, questionKey, cancellationToken);
        var sourceUrl = ValidateUrl(request);
        var item = new AuditEvidence
        {
            WorkspaceId = workspaceId, QuestionKey = questionKey, ThemeCode = Clean(request.ThemeCode), IsoStandard = ValidateWorkspaceIso(workspace, request.IsoStandard),
            EvidenceDescription = CleanNullable(request.EvidenceDescription), EvidenceCategory = CleanNullable(request.EvidenceCategory), SourceProvider = request.SourceProvider,
            SourceUrl = sourceUrl, StorageUrl = CleanNullable(request.StorageUrl), FileName = CleanNullable(request.FileName), MimeType = CleanNullable(request.MimeType),
            FileSize = request.FileSize, Version = Clean(request.Version), UploadedBy = user.UserId
        };
        db.Evidence.Add(item);
        AddActivity(workspaceId, user.UserId, "EVIDENCE_CREATED", "Evidence", item.Id.ToString(), null, request);
        await db.SaveChangesAsync(cancellationToken);
        return ToEvidence(item);
    }

    public async Task<EvidenceDto> UpdateEvidenceAsync(Guid workspaceId, string questionKey, Guid evidenceId, EvidenceRequest request, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        var item = await db.Evidence.SingleOrDefaultAsync(x => x.Id == evidenceId && x.WorkspaceId == workspaceId && x.QuestionKey == questionKey, cancellationToken) ?? throw new NotFoundException("Evidence was not found.");
        var old = ToEvidence(item);
        item.ThemeCode = Clean(request.ThemeCode); item.IsoStandard = ValidateWorkspaceIso(workspace, request.IsoStandard); item.EvidenceDescription = CleanNullable(request.EvidenceDescription);
        item.EvidenceCategory = CleanNullable(request.EvidenceCategory); item.SourceProvider = request.SourceProvider; item.SourceUrl = ValidateUrl(request);
        item.StorageUrl = CleanNullable(request.StorageUrl); item.FileName = CleanNullable(request.FileName); item.MimeType = CleanNullable(request.MimeType);
        item.FileSize = request.FileSize; item.Version = Clean(request.Version); item.UpdatedAt = DateTimeOffset.UtcNow;
        AddActivity(workspaceId, user.UserId, "EVIDENCE_UPDATED", "Evidence", item.Id.ToString(), old, request);
        await db.SaveChangesAsync(cancellationToken);
        return ToEvidence(item);
    }

    public async Task DeleteEvidenceAsync(Guid workspaceId, string questionKey, Guid evidenceId, UserContext user, CancellationToken cancellationToken)
    {
        await AuthorizedWorkspaceAsync(workspaceId, user, true, cancellationToken);
        var item = await db.Evidence.SingleOrDefaultAsync(x => x.Id == evidenceId && x.WorkspaceId == workspaceId && x.QuestionKey == questionKey, cancellationToken) ?? throw new NotFoundException("Evidence was not found.");
        db.Evidence.Remove(item);
        AddActivity(workspaceId, user.UserId, "EVIDENCE_DELETED", "Evidence", item.Id.ToString(), ToEvidence(item), null);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<WorkspaceReportDto> GetReportAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken)
    {
        var workspace = await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        var questions = await QuestionsForWorkspaceAsync(workspace, cancellationToken);
        var assessments = await db.Assessments.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).ToListAsync(cancellationToken);
        var byQuestion = assessments.ToDictionary(x => x.QuestionKey);
        var evidenceCounts = (await db.Evidence.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).Select(x => x.QuestionKey).ToListAsync(cancellationToken))
            .GroupBy(x => x).ToDictionary(x => x.Key, x => x.Count());
        FindingGroupDto Group(string key, IEnumerable<AuditQuestionAssessment> values) => new(key, values.Count(x => x.AssessmentResult == AssessmentResult.Ok), values.Count(x => x.AssessmentResult == AssessmentResult.Ofi), values.Count(x => x.AssessmentResult == AssessmentResult.Minor), values.Count(x => x.AssessmentResult == AssessmentResult.Major), values.Count(x => x.AssessmentResult == AssessmentResult.NotApplicable));
        var byTheme = questions.GroupBy(x => x.ThemeCode).Select(group => Group(group.Key, group.Where(x => byQuestion.ContainsKey(x.QuestionKey)).Select(x => byQuestion[x.QuestionKey]))).ToList();
        var byIso = workspace.SelectedIsoStandards.Select(iso => Group(iso, questions.Where(x => x.IsoStandards.Contains(iso)).Where(x => byQuestion.ContainsKey(x.QuestionKey)).Select(x => byQuestion[x.QuestionKey]))).ToList();
        var assessed = assessments.Count(x => x.AssessmentResult != AssessmentResult.NotAssessed);
        return new(ToWorkspace(workspace), questions.Count, assessed,
            assessments.Count(x => x.AssessmentResult == AssessmentResult.Ok), assessments.Count(x => x.AssessmentResult == AssessmentResult.Ofi),
            assessments.Count(x => x.AssessmentResult == AssessmentResult.Minor), assessments.Count(x => x.AssessmentResult == AssessmentResult.Major),
            assessments.Count(x => x.AssessmentResult == AssessmentResult.NotApplicable), questions.Count == 0 ? 0 : Math.Round(assessed * 100m / questions.Count, 2),
            byTheme, byIso, questions.Select(x => new QuestionEvidenceSummaryDto(x.QuestionKey, evidenceCounts.GetValueOrDefault(x.QuestionKey))).ToList(),
            questions.Where(x => evidenceCounts.GetValueOrDefault(x.QuestionKey) == 0).Select(x => x.QuestionKey).ToList(),
            questions.Where(x => !byQuestion.ContainsKey(x.QuestionKey)).Select(x => x.QuestionKey).ToList());
    }

    public async Task<IReadOnlyList<ActivityDto>> GetActivitiesAsync(Guid workspaceId, UserContext user, CancellationToken cancellationToken)
    {
        await AuthorizedWorkspaceAsync(workspaceId, user, false, cancellationToken);
        return await db.ActivityLogs.AsNoTracking().Where(x => x.WorkspaceId == workspaceId).OrderByDescending(x => x.CreatedAt)
            .Select(x => new ActivityDto(x.Id, x.WorkspaceId, x.UserId, x.ActionType, x.EntityType, x.EntityId, x.OldValue, x.NewValue, x.CreatedAt)).ToListAsync(cancellationToken);
    }

    private async Task<AuditWorkspace> AuthorizedWorkspaceAsync(Guid workspaceId, UserContext user, bool edit, CancellationToken cancellationToken)
    {
        var workspace = await db.Workspaces.Include(x => x.Members).SingleOrDefaultAsync(x => x.Id == workspaceId, cancellationToken) ?? throw new NotFoundException("Workspace was not found.");
        var member = workspace.Members.SingleOrDefault(x => x.UserId == user.UserId);
        var canView = user.IsAdministrator || workspace.CreatedBy == user.UserId || member is not null;
        var canEdit = user.IsAdministrator || workspace.CreatedBy == user.UserId || member?.MemberRole is WorkspaceMemberRole.Editor or WorkspaceMemberRole.Auditor or WorkspaceMemberRole.LeadAuditor;
        if (!(edit ? canEdit : canView)) throw new ForbiddenException("You are not authorized for this workspace.");
        return workspace;
    }

    private async Task<List<QuestionDto>> QuestionsForWorkspaceAsync(AuditWorkspace workspace, CancellationToken cancellationToken)
    {
        var all = (await MasterQuestions().ToListAsync(cancellationToken)).Select(ToQuestion);
        var selected = workspace.SelectedIsoStandards;
        return all.Where(x => string.IsNullOrWhiteSpace(workspace.AuditeeId) || workspace.AuditeeId.Equals("all-auditees", StringComparison.OrdinalIgnoreCase) ||
                (string.IsNullOrWhiteSpace(x.ApplicableAuditee)
                    ? x.ThemeCode.Equals(workspace.AuditeeId, StringComparison.OrdinalIgnoreCase)
                    : ContainsDelimitedValue(x.ApplicableAuditee, workspace.AuditeeId)))
            .Where(x => string.IsNullOrWhiteSpace(workspace.AuditFunction) || (x.ApplicableFunction ?? "").Contains("Semua Fungsi", StringComparison.OrdinalIgnoreCase) || (x.ApplicableFunction ?? "").Contains(workspace.AuditFunction, StringComparison.OrdinalIgnoreCase))
            .Where(x => x.IsoStandards.Any(iso => selected.Contains(iso, StringComparer.OrdinalIgnoreCase))).OrderBy(x => x.ThemeCode).ThenBy(x => x.QuestionKey).ToList();
    }

    private async Task EnsureQuestionAsync(AuditWorkspace workspace, string questionKey, CancellationToken cancellationToken)
    {
        if (!(await QuestionsForWorkspaceAsync(workspace, cancellationToken)).Any(x => x.QuestionKey == questionKey)) throw new NotFoundException("Question is not part of this workspace scope.");
    }

    private string ValidateUrl(EvidenceRequest request) => fileProviders.First(x => x.Supports(request.SourceProvider.ToString())).ValidateAndNormalize(request.SourceUrl).ToString();
    private static string ValidateWorkspaceIso(AuditWorkspace workspace, string iso) => workspace.SelectedIsoStandards.Contains(iso, StringComparer.OrdinalIgnoreCase) ? workspace.SelectedIsoStandards.First(x => x.Equals(iso, StringComparison.OrdinalIgnoreCase)) : throw new ArgumentException("Evidence ISO standard is not selected in this workspace.");
    private static string[] NormalizeIso(IEnumerable<string> values) => IsoStandards.Normalize(values) is { Length: > 0 } normalized ? normalized : throw new ArgumentException("At least one supported ISO standard is required.");
    private static string Clean(string value) => value.Trim();
    private static string? CleanNullable(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static AuditWorkspaceMember ToMember(MemberRequest x) => new() { UserId = x.UserId, UserName = Clean(x.UserName), UserEmail = Clean(x.UserEmail), MemberRole = x.MemberRole };
    private static void CheckConcurrency(AuditWorkspace workspace, DateTimeOffset? expected) { if (expected.HasValue && workspace.UpdatedAt != expected.Value) throw new ConflictException("Workspace was updated by another user. Reload it and retry."); }

    private void AddActivity(Guid workspaceId, Guid userId, string action, string entityType, string entityId, object? oldValue, object? newValue) => db.ActivityLogs.Add(new() { WorkspaceId = workspaceId, UserId = userId, ActionType = action, EntityType = entityType, EntityId = entityId, OldValue = oldValue is null ? null : JsonSerializer.Serialize(oldValue), NewValue = newValue is null ? null : JsonSerializer.Serialize(newValue) });
    private static WorkspaceDto ToWorkspace(AuditWorkspace x) => new(x.Id, x.WorkspaceName, x.AuditPeriodStart, x.AuditPeriodEnd, x.AuditFunction, x.AuditeeId, x.AuditeeName, x.LeadAuditorId, x.LeadAuditorName, x.SelectedIsoStandards, x.WorkspaceStatus, x.CreatedBy, x.CreatedAt, x.UpdatedAt, x.Members.Select(m => new WorkspaceMemberDto(m.Id, m.UserId, m.UserName, m.UserEmail, m.MemberRole)).ToList());
    private static AssessmentDto ToAssessment(AuditQuestionAssessment x) => new(x.Id, x.WorkspaceId, x.QuestionKey, x.AssessmentResult, x.ChecklistStatus, x.ChecklistCompleted, x.AuditorNotes, x.AuditeeResponse, x.CorrectiveAction, x.AssignedPerson, x.DueDate, x.ReviewedBy, x.ReviewedAt, x.CreatedBy, x.CreatedAt, x.UpdatedAt);
    private static EvidenceDto ToEvidence(AuditEvidence x) => new(x.Id, x.WorkspaceId, x.QuestionKey, x.ThemeCode, x.IsoStandard, x.EvidenceDescription, x.EvidenceCategory, x.SourceProvider, x.SourceUrl, x.StorageUrl, x.FileName, x.MimeType, x.FileSize, x.Version, x.UploadedBy, x.CreatedAt, x.UpdatedAt);
    private static QuestionDto ToQuestion(AuditMasterQuestion x)
    {
        var standards = new List<string>();
        if (HasIso(x.Iso9001)) standards.Add("ISO 9001"); if (HasIso(x.Iso14001)) standards.Add("ISO 14001"); if (HasIso(x.Iso45001)) standards.Add("ISO 45001"); if (HasIso(x.Iso37001)) standards.Add("ISO 37001"); if (HasIso(x.Iso22301)) standards.Add("ISO 22301");
        return new(x.QuestionKey, x.ThemeCode, x.SystemDomain, x.Objective, x.ApplicableFunction, x.WhatToVerify, x.AuditQuestion, x.Evidence, x.KpiReview, x.RiskReview, [.. standards], x.AuditorGuideline, x.EvidenceIndicator, x.QuestionCategory, x.ApplicableAuditee, x.Remarks);
    }
    private static bool HasIso(string? value) => !string.IsNullOrWhiteSpace(value) && !new[] { "false", "no", "n", "0", "-", "n/a", "not applicable" }.Contains(value.Trim(), StringComparer.OrdinalIgnoreCase);
    private static bool ContainsDelimitedValue(string? values, string expected) => (values ?? "")
        .Split([',', ';', '|'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        .Contains(expected, StringComparer.OrdinalIgnoreCase);

    private IQueryable<AuditMasterTheme> MasterThemes() => db.Database.IsRelational()
        ? db.MasterThemes.FromSqlRaw("""
            SELECT theme_id::text, audit_theme::text, audit_objective::text, primary_focus::text,
                   applicable_function::text, related_iso_standards::text, created_at
            FROM audit_master_themes
            """).AsNoTracking()
        : db.MasterThemes.AsNoTracking();

    private IQueryable<AuditMasterQuestion> MasterQuestions() => db.Database.IsRelational()
        ? db.MasterQuestions.FromSqlRaw("""
            SELECT question_key::text, theme_code::text, system_domain::text, objective::text,
                   applicable_function::text, what_to_verify::text, audit_question::text,
                   evidence::text, kpi_review::text, risk_review::text,
                   iso_9001::text, iso_14001::text, iso_45001::text, iso_37001::text, iso_22301::text,
                   auditor_guideline::text, evidence_indicator::text, question_category::text,
                   applicable_auditee::text, remarks::text, created_at
            FROM audit_master_questions
            """).AsNoTracking()
        : db.MasterQuestions.AsNoTracking();
}
