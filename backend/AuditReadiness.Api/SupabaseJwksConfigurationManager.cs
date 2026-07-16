using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace AuditReadiness.Api;

public sealed class SupabaseJwksConfigurationManager : IConfigurationManager<OpenIdConnectConfiguration>
{
    private static readonly HttpClient Http = new() { Timeout = TimeSpan.FromSeconds(10) };
    private readonly SemaphoreSlim _refreshLock = new(1, 1);
    private readonly string _issuer;
    private OpenIdConnectConfiguration? _cached;
    private DateTimeOffset _refreshAfter = DateTimeOffset.MinValue;

    public SupabaseJwksConfigurationManager(string issuer)
    {
        _issuer = issuer.TrimEnd('/');
    }

    public async Task<OpenIdConnectConfiguration> GetConfigurationAsync(CancellationToken cancel)
    {
        if (_cached is not null && DateTimeOffset.UtcNow < _refreshAfter) return _cached;
        await _refreshLock.WaitAsync(cancel);
        try
        {
            if (_cached is not null && DateTimeOffset.UtcNow < _refreshAfter) return _cached;
            var jwksUri = $"{_issuer}/.well-known/jwks.json";
            var json = await Http.GetStringAsync(jwksUri, cancel);
            var jwks = new JsonWebKeySet(json);
            var configuration = new OpenIdConnectConfiguration { Issuer = _issuer, JwksUri = jwksUri, JsonWebKeySet = jwks };
            foreach (var key in jwks.GetSigningKeys()) configuration.SigningKeys.Add(key);
            _cached = configuration;
            _refreshAfter = DateTimeOffset.UtcNow.AddMinutes(10);
            return configuration;
        }
        finally
        {
            _refreshLock.Release();
        }
    }

    public void RequestRefresh() => _refreshAfter = DateTimeOffset.MinValue;
}
