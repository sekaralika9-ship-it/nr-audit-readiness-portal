using System.Reflection;
using System.Text.Json;
using AuditReadiness.Domain;
using Microsoft.EntityFrameworkCore;

namespace AuditReadiness.Infrastructure;

public static class KeyQuestionSeeder
{
    public static async Task SeedAsync(AuditReadinessDbContext db, CancellationToken cancellationToken = default)
    {
        const string resourceName = "AuditReadiness.Infrastructure.key-questions.seed.json";
        await using var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException($"Embedded key-question seed {resourceName} was not found.");
        var source = await JsonSerializer.DeserializeAsync<List<AuditKeyQuestion>>(stream, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        }, cancellationToken) ?? [];
        var existing = await db.KeyQuestions.ToDictionaryAsync(x => x.QuestionKey, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        foreach (var row in source)
        {
            if (!existing.TryGetValue(row.QuestionKey, out var item))
            {
                row.Id = Guid.NewGuid();
                row.CreatedAt = row.UpdatedAt = now;
                db.KeyQuestions.Add(row);
                continue;
            }
            item.FunctionName = row.FunctionName;
            item.NormalizedFunctionName = FunctionNameNormalizer.Normalize(row.FunctionName);
            item.LocationName = row.LocationName;
            item.Section = row.Section;
            item.QuestionText = row.QuestionText;
            item.AuditType = row.AuditType;
            item.Reference = row.Reference;
            item.AuditTrail = row.AuditTrail;
            item.ExpectedEvidence = row.ExpectedEvidence;
            item.SamplingGuide = row.SamplingGuide;
            item.IsoClauses = row.IsoClauses;
            item.DisplayOrder = row.DisplayOrder;
            item.SourceDocument = row.SourceDocument;
            item.IsActive = true;
            item.UpdatedAt = now;
        }
        await db.SaveChangesAsync(cancellationToken);
    }
}
