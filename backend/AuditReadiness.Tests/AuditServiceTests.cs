using AuditReadiness.Application;
using AuditReadiness.Domain;
using AuditReadiness.Infrastructure;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;

namespace AuditReadiness.Tests;

public sealed class AuditServiceTests
{
    private static readonly UserContext Owner = new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "owner@example.com", new HashSet<string>());

    [Fact]
    public async Task CreateWorkspace_PersistsAndCanBeReopened()
    {
        await using var db = CreateDb();
        var service = CreateService(db);
        var created = await service.CreateWorkspaceAsync(Request(), Owner, default);

        var reopened = await service.GetWorkspaceAsync(created.Id, Owner, default);

        reopened.WorkspaceName.Should().Be("Q3 Readiness");
        reopened.CreatedBy.Should().Be(Owner.UserId);
        (await db.Workspaces.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task CreateWorkspace_AllIsoExpandsToEverySupportedStandard()
    {
        await using var db = CreateDb();
        var created = await CreateService(db).CreateWorkspaceAsync(Request(["All ISO"]), Owner, default);
        created.SelectedIsoStandards.Should().BeEquivalentTo(IsoStandards.All);
    }

    [Fact]
    public async Task Questions_FilterByThemeAndIsoCaseInsensitively()
    {
        await using var db = CreateDb();
        SeedQuestions(db);
        await db.SaveChangesAsync();
        var service = CreateService(db);

        var a01 = await service.GetQuestionsAsync("a01", null, null, null, 1, 20, default);
        var iso = await service.GetQuestionsAsync(null, null, "iso 45001", null, 1, 20, default);

        a01.Items.Should().OnlyContain(x => x.ThemeCode == "A01").And.HaveCount(2);
        iso.Items.Should().ContainSingle(x => x.QuestionKey == "A01-Q2");
    }

    [Fact]
    public async Task Assessment_UpsertCreatesThenUpdatesWithoutDuplicate()
    {
        await using var db = CreateDb();
        SeedQuestions(db);
        var service = CreateService(db);
        var workspace = await service.CreateWorkspaceAsync(Request(["All ISO"]), Owner, default);

        await service.UpsertAssessmentAsync(workspace.Id, "A01-Q1", new() { AssessmentResult = AssessmentResult.Ok, ChecklistCompleted = true }, Owner, default);
        var updated = await service.UpsertAssessmentAsync(workspace.Id, "A01-Q1", new() { AssessmentResult = AssessmentResult.Ofi, AuditorNotes = "Follow up" }, Owner, default);

        updated.AssessmentResult.Should().Be(AssessmentResult.Ofi);
        updated.AuditorNotes.Should().Be("Follow up");
        (await db.Assessments.CountAsync()).Should().Be(1);
    }

    [Fact]
    public async Task Evidence_IsStoredUnderTheCorrectWorkspaceQuestion()
    {
        await using var db = CreateDb();
        SeedQuestions(db);
        var service = CreateService(db);
        var workspace = await service.CreateWorkspaceAsync(Request(), Owner, default);

        await service.AddEvidenceAsync(workspace.Id, "A01-Q1", new() { ThemeCode = "A01", IsoStandard = "ISO 9001", SourceProvider = EvidenceSourceProvider.OneDrive, SourceUrl = "https://company.sharepoint.com/:u:/e/example", FileName = "evidence.pdf" }, Owner, default);

        var evidence = await service.GetEvidenceAsync(workspace.Id, "A01-Q1", Owner, default);
        evidence.Should().ContainSingle().Which.FileName.Should().Be("evidence.pdf");
        (await service.GetEvidenceAsync(workspace.Id, "A01-Q2", Owner, default)).Should().BeEmpty();
    }

    [Fact]
    public async Task UnauthorizedUser_CannotReadWorkspace()
    {
        await using var db = CreateDb();
        var service = CreateService(db);
        var workspace = await service.CreateWorkspaceAsync(Request(), Owner, default);
        var outsider = new UserContext(Guid.NewGuid(), "outsider@example.com", new HashSet<string>());

        var action = () => service.GetWorkspaceAsync(workspace.Id, outsider, default);
        await action.Should().ThrowAsync<ForbiddenException>();
    }

    [Fact]
    public async Task Report_CalculatesResultsEvidenceAndMissingItems()
    {
        await using var db = CreateDb();
        SeedQuestions(db);
        var service = CreateService(db);
        var workspace = await service.CreateWorkspaceAsync(Request(["All ISO"]), Owner, default);
        await service.UpsertAssessmentAsync(workspace.Id, "A01-Q1", new() { AssessmentResult = AssessmentResult.Ok }, Owner, default);
        await service.UpsertAssessmentAsync(workspace.Id, "A01-Q2", new() { AssessmentResult = AssessmentResult.Major }, Owner, default);
        await service.AddEvidenceAsync(workspace.Id, "A01-Q1", new() { ThemeCode = "A01", IsoStandard = "ISO 9001", SourceUrl = "https://example.com/evidence", SourceProvider = EvidenceSourceProvider.ExternalLink }, Owner, default);

        var report = await service.GetReportAsync(workspace.Id, Owner, default);

        report.TotalQuestions.Should().Be(2);
        report.AssessedQuestions.Should().Be(2);
        report.OkCount.Should().Be(1);
        report.MajorCount.Should().Be(1);
        report.CompletionPercentage.Should().Be(100);
        report.QuestionsWithoutEvidence.Should().ContainSingle("A01-Q2");
        report.QuestionsWithoutAssessment.Should().BeEmpty();
    }

    private static AuditReadinessDbContext CreateDb() => new(new DbContextOptionsBuilder<AuditReadinessDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
    private static AuditService CreateService(AuditReadinessDbContext db) => new(db, [new OneDriveFileProvider(), new GenericExternalFileProvider()]);
    private static CreateWorkspaceRequest Request(string[]? iso = null) => new()
    {
        WorkspaceName = " Q3 Readiness ", AuditPeriodStart = new(2026, 7, 1), AuditPeriodEnd = new(2026, 9, 30), AuditFunction = "Direksi",
        AuditeeId = "A01", AuditeeName = "Direksi", SelectedIsoStandards = iso ?? ["ISO 9001"]
    };
    private static void SeedQuestions(AuditReadinessDbContext db)
    {
        db.MasterQuestions.AddRange(
            new() { QuestionKey = "A01-Q1", ThemeCode = "A01", ApplicableFunction = "Direksi", AuditQuestion = "Leadership commitment?", Iso9001 = "Yes" },
            new() { QuestionKey = "A01-Q2", ThemeCode = "A01", ApplicableFunction = "Direksi", AuditQuestion = "Safety governance?", Iso45001 = "Yes" },
            new() { QuestionKey = "A02-Q1", ThemeCode = "A02", ApplicableFunction = "Strategic Planning", AuditQuestion = "Strategy review?", Iso9001 = "Yes" });
    }
}
