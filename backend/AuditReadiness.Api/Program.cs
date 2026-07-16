using System.Text;
using System.Text.Json.Serialization;
using AuditReadiness.Api;
using AuditReadiness.Infrastructure;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Host.UseSerilog((context, services, logger) => logger
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console());

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
builder.Services.Configure<Microsoft.AspNetCore.Mvc.ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context => ValidationProblemFactory.Create(context);
});

var issuer = builder.Configuration["SUPABASE_JWT_ISSUER"]
    ?? (builder.Configuration["SUPABASE_URL"]?.TrimEnd('/') + "/auth/v1");
var audience = builder.Configuration["SUPABASE_JWT_AUDIENCE"] ?? "authenticated";
var jwtKey = builder.Configuration["SUPABASE_JWT_KEY"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true;
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = issuer,
        ValidateAudience = true, ValidAudience = audience,
        ValidateLifetime = true, ValidateIssuerSigningKey = true,
        NameClaimType = "email", RoleClaimType = "role",
        ClockSkew = TimeSpan.FromMinutes(1)
    };
    if (!string.IsNullOrWhiteSpace(jwtKey))
        options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
    else if (!string.IsNullOrWhiteSpace(issuer))
        options.ConfigurationManager = new SupabaseJwksConfigurationManager(issuer);
});

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("WorkspaceViewer", policy => policy.RequireAuthenticatedUser())
    .AddPolicy("WorkspaceEditor", policy => policy.RequireAuthenticatedUser())
    .AddPolicy("Auditor", policy => policy.RequireAssertion(context => context.User.Identity?.IsAuthenticated == true))
    .AddPolicy("LeadAuditor", policy => policy.RequireAssertion(context => context.User.IsInRole("lead_auditor") || context.User.IsInRole("administrator")))
    .AddPolicy("Administrator", policy => policy.RequireRole("administrator", "admin"));

var allowedOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
{
    "http://localhost:5173", "http://127.0.0.1:5173", "https://nr-audit-readiness-portal.vercel.app"
};
if (Uri.TryCreate(builder.Configuration["FRONTEND_URL"], UriKind.Absolute, out var configuredFrontend))
    allowedOrigins.Add(configuredFrontend.GetLeftPart(UriPartial.Authority));
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy =>
    policy.WithOrigins([.. allowedOrigins]).AllowAnyHeader().AllowAnyMethod()));

builder.Services.AddInfrastructure(builder.Configuration);
var connectionString = builder.Configuration["DATABASE_CONNECTION_STRING"] ?? builder.Configuration.GetConnectionString("Database")!;
builder.Services.AddHealthChecks().AddNpgSql(connectionString, name: "postgresql", tags: ["ready"]);
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "NR Audit Readiness API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header });
    options.AddSecurityRequirement(new OpenApiSecurityRequirement { [new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } }] = [] });
});

var app = builder.Build();
app.UseSerilogRequestLogging();
app.UseExceptionHandler();
app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();

public partial class Program;
