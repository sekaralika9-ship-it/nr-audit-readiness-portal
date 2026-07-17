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

    [Theory]
    [InlineData("HC & Quality Management", "human capital quality management")]
    [InlineData("Human Capital and Quality Management", "human capital quality management")]
    [InlineData("Asset Integrity & Maintenance", "asset integrity maintenance management")]
    [InlineData("Strategic Planning & Performance", "strategic planning port performance")]
    public void FunctionNormalizer_ResolvesApprovedAliases(string source, string expected) =>
        FunctionNameNormalizer.Normalize(source).Should().Be(expected);

    [Fact]
    public async Task WorkspaceQuestions_UseCoreSpecificAndSelectedLocationCatalog()
    {
        await using var db = CreateDb();
        SeedKeyQuestions(db);
        var request = Request(["All ISO"]);
        request = new CreateWorkspaceRequest
        {
            WorkspaceName = request.WorkspaceName, AuditPeriodStart = request.AuditPeriodStart, AuditPeriodEnd = request.AuditPeriodEnd,
            AuditFunction = "Manager HSSE", AuditLocation = "Tinjauan Warehouse Sunter", AuditeeId = "A06", AuditeeName = "Manager HSSE",
            SelectedIsoStandards = request.SelectedIsoStandards
        };
        var service = CreateService(db);
        var workspace = await service.CreateWorkspaceAsync(request, Owner, default);

        var questions = await service.GetWorkspaceQuestionsAsync(workspace.Id, Owner, default);

        questions.Select(x => x.Question.QuestionKey).Should().BeEquivalentTo("KQ-HSSE-CORE-01", "KQ-HSSE-SPECIFIC-01", "KQ-LOCWH-SPECIFIC-01");
        questions.Select(x => x.Question.Section).Should().Contain("CORE").And.Contain("SPECIFIC");
    }

    [Fact]
    public async Task EditingWorkspaceScope_PreservesOldAssessmentsButReportsOnlyApplicableQuestions()
    {
        await using var db = CreateDb();
        SeedKeyQuestions(db);
        var service = CreateService(db);
        var original = await service.CreateWorkspaceAsync(new CreateWorkspaceRequest
        {
            WorkspaceName = "Scope test", AuditPeriodStart = new(2026, 7, 1), AuditPeriodEnd = new(2026, 7, 31),
            AuditFunction = "HSSE", AuditeeId = "A06", AuditeeName = "Manager HSSE", SelectedIsoStandards = ["All ISO"]
        }, Owner, default);
        await service.UpsertAssessmentAsync(original.Id, "KQ-HSSE-CORE-01", new() { AssessmentResult = AssessmentResult.Ok }, Owner, default);

        var updated = await service.UpdateWorkspaceAsync(original.Id, new UpdateWorkspaceRequest
        {
            WorkspaceName = original.WorkspaceName, AuditPeriodStart = original.AuditPeriodStart, AuditPeriodEnd = original.AuditPeriodEnd,
            AuditFunction = "Procurement", AuditeeId = "A14", AuditeeName = "Manager Procurement", SelectedIsoStandards = ["All ISO"],
            WorkspaceStatus = original.WorkspaceStatus, ExpectedUpdatedAt = original.UpdatedAt
        }, Owner, default);
        var questions = await service.GetWorkspaceQuestionsAsync(updated.Id, Owner, default);
        var report = await service.GetReportAsync(updated.Id, Owner, default);

        questions.Should().ContainSingle(x => x.Question.QuestionKey == "KQ-PROC-CORE-01");
        (await db.Assessments.CountAsync(x => x.QuestionKey == "KQ-HSSE-CORE-01")).Should().Be(1);
        report.AssessedQuestions.Should().Be(0);
    }

    [Fact]
    public async Task KeyQuestionSeed_IsIdempotentAndUsesStableUniqueKeys()
    {
        await using var db = CreateDb();
        await KeyQuestionSeeder.SeedAsync(db);
        await KeyQuestionSeeder.SeedAsync(db);

        (await db.KeyQuestions.CountAsync()).Should().Be(214);
        (await db.KeyQuestions.Select(x => x.QuestionKey).Distinct().CountAsync()).Should().Be(214);
        (await db.KeyQuestions.CountAsync(x => x.Section == "CORE")).Should().Be(120);
        (await db.KeyQuestions.CountAsync(x => x.Section == "SPECIFIC")).Should().Be(94);
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
    private static void SeedKeyQuestions(AuditReadinessDbContext db)
    {
        db.KeyQuestions.AddRange(
            new() { QuestionKey = "KQ-HSSE-CORE-01", FunctionName = "HSSE", NormalizedFunctionName = "hsse", Section = "CORE", QuestionText = "Core HSSE?", IsoClauses = new() { ["ISO 45001"] = "5.1" }, DisplayOrder = 1, SourceDocument = "matrix.xlsx" },
            new() { QuestionKey = "KQ-HSSE-SPECIFIC-01", FunctionName = "HSSE", NormalizedFunctionName = "hsse", Section = "SPECIFIC", QuestionText = "Specific HSSE?", IsoClauses = new() { ["ISO 45001"] = "8.1" }, DisplayOrder = 1, SourceDocument = "questions.docx" },
            new() { QuestionKey = "KQ-LOCWH-SPECIFIC-01", LocationName = "Tinjauan Warehouse Sunter", Section = "SPECIFIC", QuestionText = "Warehouse review?", IsoClauses = new() { ["ISO 9001"] = "8.5" }, DisplayOrder = 1, SourceDocument = "questions.docx" },
            new() { QuestionKey = "KQ-PROC-CORE-01", FunctionName = "Procurement", NormalizedFunctionName = "procurement", Section = "CORE", QuestionText = "Core procurement?", IsoClauses = new() { ["ISO 37001"] = "8.2" }, DisplayOrder = 1, SourceDocument = "matrix.xlsx" });
    }
}
