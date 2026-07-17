using System.Text.RegularExpressions;

namespace AuditReadiness.Infrastructure;

public static partial class FunctionNameNormalizer
{
    private static readonly IReadOnlyDictionary<string, string> CanonicalAliases = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        ["hc quality management"] = "human capital quality management",
        ["human capital quality management"] = "human capital quality management",
        ["hcqm"] = "human capital quality management",
        ["asset integrity maintenance"] = "asset integrity maintenance management",
        ["asset integrity maintenance management"] = "asset integrity maintenance management",
        ["strategic planning performance"] = "strategic planning port performance",
        ["strategic planning port performance"] = "strategic planning port performance",
        ["isga"] = "information system general affair"
    };

    private static readonly IReadOnlyDictionary<string, string[]> AuditeeScopes = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
    {
        ["a02"] = ["strategic planning port performance", "business development"],
        ["a03"] = ["corporate secretary"], ["a04"] = ["risk strategy governance"], ["a05"] = ["risk implementation"],
        ["a06"] = ["hsse"], ["a07"] = ["legal compliance"], ["a08"] = ["audit executive"],
        ["a09"] = ["lng transportation fsru operation", "gas distribusi man orf"],
        ["a10"] = ["technical engineering", "asset integrity maintenance management"],
        ["a11"] = ["controller", "treasury"], ["a12"] = ["human capital quality management"],
        ["a13"] = ["information system general affair"], ["a14"] = ["procurement"], ["a15"] = ["commercial lng gas"],
        ["vp strategic planning business development"] = ["strategic planning port performance", "business development"],
        ["manager hsse"] = ["hsse"],
        ["manager legal compliance"] = ["legal compliance"],
        ["chief audit executive"] = ["audit executive"],
        ["vp operation"] = ["lng transportation fsru operation", "gas distribusi man orf"],
        ["vp engineering maintenance"] = ["technical engineering", "asset integrity maintenance management"],
        ["vp finance"] = ["controller", "treasury"],
        ["manager hcqm"] = ["human capital quality management"],
        ["manager isga"] = ["information system general affair"],
        ["manager procurement"] = ["procurement"],
        ["manager commercial lng gas"] = ["commercial lng gas"],
        ["corporate secretary"] = ["corporate secretary"],
        ["vp risk strategy governance"] = ["risk strategy governance"],
        ["vp risk implementation"] = ["risk implementation"]
    };

    public static string Normalize(string? value)
    {
        var normalized = MultiSpace().Replace(NonAlphaNumeric().Replace((value ?? "").ToLowerInvariant().Replace("&", " and "), " "), " ").Trim();
        normalized = WholeAnd().Replace(normalized, " ");
        normalized = MultiSpace().Replace(normalized, " ").Trim();
        return CanonicalAliases.GetValueOrDefault(normalized, normalized);
    }

    public static IReadOnlySet<string> WorkspaceScopes(string? auditFunction, string? auditeeName)
    {
        var values = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        foreach (var source in new[] { auditFunction, auditeeName })
        {
            var normalized = Normalize(source);
            if (!string.IsNullOrWhiteSpace(normalized)) values.Add(normalized);
            if (AuditeeScopes.TryGetValue(normalized, out var aliases)) values.UnionWith(aliases.Select(Normalize));
        }
        return values;
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NonAlphaNumeric();
    [GeneratedRegex("\\band\\b")]
    private static partial Regex WholeAnd();
    [GeneratedRegex("\\s+")]
    private static partial Regex MultiSpace();
}
