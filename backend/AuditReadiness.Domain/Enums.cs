namespace AuditReadiness.Domain;

public enum WorkspaceStatus { Draft, Active, UnderReview, Completed, Archived }
public enum WorkspaceMemberRole { Viewer, Auditor, LeadAuditor, Editor }
public enum AssessmentResult { NotAssessed, Ok, Ofi, Minor, Major, NotApplicable }
public enum EvidenceSourceProvider { OneDrive, ExternalLink, ManualUpload, InternalDocument }

public static class IsoStandards
{
    public static readonly string[] All = ["ISO 9001", "ISO 14001", "ISO 45001", "ISO 37001", "ISO 22301"];

    public static string[] Normalize(IEnumerable<string> values)
    {
        var requested = values.Select(x => x.Trim()).Where(x => x.Length > 0).ToArray();
        if (requested.Any(x => x.Equals("All ISO", StringComparison.OrdinalIgnoreCase))) return [.. All];
        return All.Where(allowed => requested.Any(x => x.Equals(allowed, StringComparison.OrdinalIgnoreCase))).ToArray();
    }
}
