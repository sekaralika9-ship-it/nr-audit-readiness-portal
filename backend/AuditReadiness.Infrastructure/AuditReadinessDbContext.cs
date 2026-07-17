using AuditReadiness.Domain;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using System.Text.Json;

namespace AuditReadiness.Infrastructure;

public sealed class AuditReadinessDbContext(DbContextOptions<AuditReadinessDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>(options)
{
    public DbSet<AuditWorkspace> Workspaces => Set<AuditWorkspace>();
    public DbSet<AuditWorkspaceMember> WorkspaceMembers => Set<AuditWorkspaceMember>();
    public DbSet<AuditQuestionAssessment> Assessments => Set<AuditQuestionAssessment>();
    public DbSet<AuditEvidence> Evidence => Set<AuditEvidence>();
    public DbSet<AuditActivityLog> ActivityLogs => Set<AuditActivityLog>();
    public DbSet<AuditDocument> Documents => Set<AuditDocument>();
    public DbSet<AuditMasterTheme> MasterThemes => Set<AuditMasterTheme>();
    public DbSet<AuditMasterQuestion> MasterQuestions => Set<AuditMasterQuestion>();
    public DbSet<AuditKeyQuestion> KeyQuestions => Set<AuditKeyQuestion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("uuid-ossp");

        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.ToTable("app_users");
            entity.Property(x => x.FullName).HasColumnName("full_name").HasMaxLength(200);
            entity.Property(x => x.Function).HasColumnName("function").HasMaxLength(200);
            entity.Property(x => x.Department).HasColumnName("department").HasMaxLength(200);
            entity.Property(x => x.EmployeeId).HasColumnName("employee_id").HasMaxLength(100);
            entity.Property(x => x.Phone).HasColumnName("phone").HasMaxLength(50);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        });
        modelBuilder.Entity<IdentityRole<Guid>>().ToTable("app_roles");
        modelBuilder.Entity<IdentityUserRole<Guid>>().ToTable("app_user_roles");
        modelBuilder.Entity<IdentityUserClaim<Guid>>().ToTable("app_user_claims");
        modelBuilder.Entity<IdentityUserLogin<Guid>>().ToTable("app_user_logins");
        modelBuilder.Entity<IdentityRoleClaim<Guid>>().ToTable("app_role_claims");
        modelBuilder.Entity<IdentityUserToken<Guid>>().ToTable("app_user_tokens");

        modelBuilder.Entity<AuditWorkspace>(entity =>
        {
            entity.ToTable("audit_workspaces");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.WorkspaceName).HasColumnName("workspace_name").HasMaxLength(200);
            entity.Property(x => x.AuditPeriodStart).HasColumnName("audit_period_start");
            entity.Property(x => x.AuditPeriodEnd).HasColumnName("audit_period_end");
            entity.Property(x => x.AuditFunction).HasColumnName("audit_function").HasMaxLength(200);
            entity.Property(x => x.AuditLocation).HasColumnName("audit_location").HasMaxLength(250);
            entity.Property(x => x.AuditeeId).HasColumnName("auditee_id").HasMaxLength(50);
            entity.Property(x => x.AuditeeName).HasColumnName("auditee_name").HasMaxLength(200);
            entity.Property(x => x.LeadAuditorId).HasColumnName("lead_auditor_id");
            entity.Property(x => x.LeadAuditorName).HasColumnName("lead_auditor_name").HasMaxLength(200);
            entity.Property(x => x.SelectedIsoStandards).HasColumnName("selected_iso_standards").HasColumnType("text[]");
            entity.Property(x => x.WorkspaceStatus).HasColumnName("workspace_status").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").IsConcurrencyToken();
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            entity.Property(x => x.DeletedAt).HasColumnName("deleted_at");
            entity.HasQueryFilter(x => !x.IsDeleted);
            entity.HasIndex(x => x.CreatedBy);
            entity.HasIndex(x => new { x.AuditeeId, x.WorkspaceStatus });
        });

        modelBuilder.Entity<AuditWorkspaceMember>(entity =>
        {
            entity.ToTable("audit_workspace_members");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.WorkspaceId).HasColumnName("workspace_id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.UserName).HasColumnName("user_name").HasMaxLength(200);
            entity.Property(x => x.UserEmail).HasColumnName("user_email").HasMaxLength(320);
            entity.Property(x => x.MemberRole).HasColumnName("member_role").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Workspace).WithMany(x => x.Members).HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => !x.Workspace.IsDeleted);
            entity.HasIndex(x => new { x.WorkspaceId, x.UserId }).IsUnique();
            entity.HasIndex(x => x.UserId);
        });

        modelBuilder.Entity<AuditQuestionAssessment>(entity =>
        {
            entity.ToTable("audit_question_assessments");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.WorkspaceId).HasColumnName("workspace_id");
            entity.Property(x => x.QuestionKey).HasColumnName("question_key").HasMaxLength(100);
            entity.Property(x => x.AssessmentResult).HasColumnName("assessment_result").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.ChecklistStatus).HasColumnName("checklist_status").HasMaxLength(30);
            entity.Property(x => x.ChecklistCompleted).HasColumnName("checklist_completed");
            entity.Property(x => x.AuditorNotes).HasColumnName("auditor_notes").HasMaxLength(5000);
            entity.Property(x => x.AuditeeResponse).HasColumnName("auditee_response").HasMaxLength(5000);
            entity.Property(x => x.CorrectiveAction).HasColumnName("corrective_action").HasMaxLength(5000);
            entity.Property(x => x.AssignedPerson).HasColumnName("assigned_person").HasMaxLength(200);
            entity.Property(x => x.DueDate).HasColumnName("due_date");
            entity.Property(x => x.ReviewedBy).HasColumnName("reviewed_by");
            entity.Property(x => x.ReviewedAt).HasColumnName("reviewed_at");
            entity.Property(x => x.CreatedBy).HasColumnName("created_by");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.Workspace).WithMany(x => x.Assessments).HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => !x.Workspace.IsDeleted);
            entity.HasIndex(x => new { x.WorkspaceId, x.QuestionKey }).IsUnique();
            entity.HasIndex(x => new { x.WorkspaceId, x.AssessmentResult });
        });

        modelBuilder.Entity<AuditEvidence>(entity =>
        {
            entity.ToTable("audit_evidence");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.WorkspaceId).HasColumnName("workspace_id");
            entity.Property(x => x.QuestionKey).HasColumnName("question_key").HasMaxLength(100);
            entity.Property(x => x.ThemeCode).HasColumnName("theme_code").HasMaxLength(50);
            entity.Property(x => x.IsoStandard).HasColumnName("iso_standard").HasMaxLength(50);
            entity.Property(x => x.EvidenceDescription).HasColumnName("evidence_description").HasMaxLength(2000);
            entity.Property(x => x.EvidenceCategory).HasColumnName("evidence_category").HasMaxLength(100);
            entity.Property(x => x.SourceProvider).HasColumnName("source_provider").HasConversion<string>().HasMaxLength(30);
            entity.Property(x => x.SourceUrl).HasColumnName("source_url").HasMaxLength(2048);
            entity.Property(x => x.StorageUrl).HasColumnName("storage_url").HasMaxLength(2048);
            entity.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255);
            entity.Property(x => x.MimeType).HasColumnName("mime_type").HasMaxLength(150);
            entity.Property(x => x.FileSize).HasColumnName("file_size");
            entity.Property(x => x.Version).HasColumnName("version").HasMaxLength(30);
            entity.Property(x => x.UploadedBy).HasColumnName("uploaded_by");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasOne(x => x.Workspace).WithMany(x => x.Evidence).HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => !x.Workspace.IsDeleted);
            entity.HasIndex(x => new { x.WorkspaceId, x.QuestionKey });
            entity.HasIndex(x => x.UploadedBy);
        });

        modelBuilder.Entity<AuditActivityLog>(entity =>
        {
            entity.ToTable("audit_activity_logs");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.WorkspaceId).HasColumnName("workspace_id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.ActionType).HasColumnName("action_type").HasMaxLength(80);
            entity.Property(x => x.EntityType).HasColumnName("entity_type").HasMaxLength(80);
            entity.Property(x => x.EntityId).HasColumnName("entity_id").HasMaxLength(100);
            entity.Property(x => x.OldValue).HasColumnName("old_value").HasColumnType("jsonb");
            entity.Property(x => x.NewValue).HasColumnName("new_value").HasColumnType("jsonb");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Workspace).WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasQueryFilter(x => !x.Workspace.IsDeleted);
            entity.HasIndex(x => new { x.WorkspaceId, x.CreatedAt });
        });

        modelBuilder.Entity<AuditDocument>(entity =>
        {
            entity.ToTable("audit_documents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.UserId).HasColumnName("user_id");
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(250);
            entity.Property(x => x.Description).HasColumnName("description").HasMaxLength(2000);
            entity.Property(x => x.Category).HasColumnName("category").HasMaxLength(100);
            entity.Property(x => x.Function).HasColumnName("function").HasMaxLength(200);
            entity.Property(x => x.FilePath).HasColumnName("file_path").HasMaxLength(2048);
            entity.Property(x => x.FileName).HasColumnName("file_name").HasMaxLength(255);
            entity.Property(x => x.FileType).HasColumnName("file_type").HasMaxLength(150);
            entity.Property(x => x.FileSize).HasColumnName("file_size");
            entity.Property(x => x.Status).HasColumnName("status").HasMaxLength(50);
            entity.Property(x => x.UploadedBy).HasColumnName("uploaded_by");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(x => x.UserId);
            entity.HasIndex(x => x.CreatedAt);
        });

        modelBuilder.Entity<AuditMasterTheme>(entity =>
        {
            entity.ToTable("audit_master_themes", table => table.ExcludeFromMigrations());
            entity.HasKey(x => x.ThemeId);
            entity.Property(x => x.ThemeId).HasColumnName("theme_id");
            entity.Property(x => x.AuditTheme).HasColumnName("audit_theme");
            entity.Property(x => x.AuditObjective).HasColumnName("audit_objective");
            entity.Property(x => x.PrimaryFocus).HasColumnName("primary_focus");
            entity.Property(x => x.ApplicableFunction).HasColumnName("applicable_function");
            entity.Property(x => x.RelatedIsoStandards).HasColumnName("related_iso_standards");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<AuditMasterQuestion>(entity =>
        {
            entity.ToTable("audit_master_questions", table => table.ExcludeFromMigrations());
            entity.HasKey(x => x.QuestionKey);
            entity.Property(x => x.QuestionKey).HasColumnName("question_key");
            entity.Property(x => x.ThemeCode).HasColumnName("theme_code");
            entity.Property(x => x.SystemDomain).HasColumnName("system_domain");
            entity.Property(x => x.Objective).HasColumnName("objective");
            entity.Property(x => x.ApplicableFunction).HasColumnName("applicable_function");
            entity.Property(x => x.WhatToVerify).HasColumnName("what_to_verify");
            entity.Property(x => x.AuditQuestion).HasColumnName("audit_question");
            entity.Property(x => x.Evidence).HasColumnName("evidence");
            entity.Property(x => x.KpiReview).HasColumnName("kpi_review");
            entity.Property(x => x.RiskReview).HasColumnName("risk_review");
            entity.Property(x => x.Iso9001).HasColumnName("iso_9001");
            entity.Property(x => x.Iso14001).HasColumnName("iso_14001");
            entity.Property(x => x.Iso45001).HasColumnName("iso_45001");
            entity.Property(x => x.Iso37001).HasColumnName("iso_37001");
            entity.Property(x => x.Iso22301).HasColumnName("iso_22301");
            entity.Property(x => x.AuditorGuideline).HasColumnName("auditor_guideline");
            entity.Property(x => x.EvidenceIndicator).HasColumnName("evidence_indicator");
            entity.Property(x => x.QuestionCategory).HasColumnName("question_category");
            entity.Property(x => x.ApplicableAuditee).HasColumnName("applicable_auditee");
            entity.Property(x => x.Remarks).HasColumnName("remarks");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<AuditKeyQuestion>(entity =>
        {
            entity.ToTable("audit_key_questions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Id).HasColumnName("id");
            entity.Property(x => x.QuestionKey).HasColumnName("question_key").HasMaxLength(100);
            entity.Property(x => x.FunctionName).HasColumnName("function_name").HasMaxLength(250);
            entity.Property(x => x.NormalizedFunctionName).HasColumnName("normalized_function_name").HasMaxLength(250);
            entity.Property(x => x.LocationName).HasColumnName("location_name").HasMaxLength(250);
            entity.Property(x => x.Section).HasColumnName("section").HasMaxLength(20);
            entity.Property(x => x.QuestionText).HasColumnName("question_text").HasMaxLength(3000);
            entity.Property(x => x.AuditType).HasColumnName("audit_type").HasMaxLength(1000);
            entity.Property(x => x.Reference).HasColumnName("reference").HasMaxLength(2000);
            entity.Property(x => x.AuditTrail).HasColumnName("audit_trail").HasMaxLength(3000);
            entity.Property(x => x.ExpectedEvidence).HasColumnName("expected_evidence").HasMaxLength(3000);
            entity.Property(x => x.SamplingGuide).HasColumnName("sampling_guide").HasMaxLength(3000);
            var clausesProperty = entity.Property(x => x.IsoClauses)
                .HasConversion(new ValueConverter<Dictionary<string, string>, string>(
                    value => SerializeClauses(value), value => DeserializeClauses(value)))
                .HasColumnName("iso_clauses").HasColumnType("jsonb");
            clausesProperty.Metadata.SetValueComparer(new ValueComparer<Dictionary<string, string>>(
                (left, right) => SerializeClauses(left) == SerializeClauses(right),
                value => SerializeClauses(value).GetHashCode(),
                value => DeserializeClauses(SerializeClauses(value))));
            entity.Property(x => x.DisplayOrder).HasColumnName("display_order");
            entity.Property(x => x.SourceDocument).HasColumnName("source_document").HasMaxLength(255);
            entity.Property(x => x.IsActive).HasColumnName("is_active");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.HasIndex(x => x.QuestionKey).IsUnique();
            entity.HasIndex(x => new { x.NormalizedFunctionName, x.Section, x.DisplayOrder });
            entity.HasIndex(x => new { x.LocationName, x.DisplayOrder });
        });
    }

    private static string SerializeClauses(Dictionary<string, string>? value) => JsonSerializer.Serialize(value ?? []);
    private static Dictionary<string, string> DeserializeClauses(string value) => JsonSerializer.Deserialize<Dictionary<string, string>>(value) ?? [];
}
