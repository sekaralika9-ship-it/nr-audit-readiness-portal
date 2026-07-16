# NR Audit Readiness API

## Architecture

The backend is a separate .NET 8 ASP.NET Core Web API. The React/Vite application remains hosted on Vercel, Supabase Auth issues user access tokens, and this API validates those tokens before accessing Supabase PostgreSQL through EF Core/Npgsql.

The solution uses a compact clean architecture:

- `AuditReadiness.Domain`: transactional and read-only master entities, enums, ISO rules.
- `AuditReadiness.Application`: API contracts, validated requests, DTOs, service abstractions.
- `AuditReadiness.Infrastructure`: EF Core context, PostgreSQL mappings, authorization-aware business service, OneDrive URL provider, migrations.
- `AuditReadiness.Api`: versioned controllers, JWT authentication, policies, ProblemDetails, Swagger, CORS, logging, health checks.
- `AuditReadiness.Tests`: xUnit service and HTTP security tests.

The existing `audit_master_themes` and `audit_master_questions` tables are mapped read-only and excluded from migrations. The migration only creates transactional tables.

## Required environment variables

Copy `.env.example` to a secret environment file or configure your process/container host:

- `DATABASE_CONNECTION_STRING`: Supabase PostgreSQL server connection string. Use SSL and the Supabase connection pooler when required.
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_JWT_ISSUER`: normally `${SUPABASE_URL}/auth/v1`.
- `SUPABASE_JWT_AUDIENCE`: normally `authenticated`.
- `SUPABASE_JWT_KEY`: optional legacy HS256 secret. Do not use the frontend anon key here. Modern asymmetric projects use the official `${SUPABASE_JWT_ISSUER}/.well-known/jwks.json` endpoint when this is omitted.
- `FRONTEND_URL`: optional additional allowed frontend origin.
- `ASPNETCORE_ENVIRONMENT`: `Development` or `Production`.
- `ASPNETCORE_URLS`: for example `http://0.0.0.0:5000`.

Never commit the database password, JWT secret, or service-role key. `VITE_` variables are public browser configuration and must never contain backend secrets.

## Local development

Install .NET 8, then from `backend/`:

```bash
dotnet restore
dotnet build
dotnet ef database update --project AuditReadiness.Infrastructure --startup-project AuditReadiness.Api
dotnet run --project AuditReadiness.Api
```

Swagger is available at `http://localhost:5000/swagger`. Select **Authorize** and enter a current Supabase access token. Health status is available at `http://localhost:5000/health` and includes PostgreSQL connectivity.

## Migrations

Create a migration after an intentional model change:

```bash
dotnet ef migrations add MigrationName \
  --project AuditReadiness.Infrastructure \
  --startup-project AuditReadiness.Api \
  --output-dir Migrations
```

Apply migrations:

```bash
dotnet ef database update \
  --project AuditReadiness.Infrastructure \
  --startup-project AuditReadiness.Api
```

Review generated SQL before applying in production:

```bash
dotnet ef migrations script --idempotent \
  --project AuditReadiness.Infrastructure \
  --startup-project AuditReadiness.Api
```

## Tests

```bash
dotnet test
```

The suite covers workspace persistence, All ISO expansion, A01 and ISO filtering, assessment create/update without duplicates, question evidence, workspace authorization, report totals, JWT protection, and validation errors.

## Frontend connection

Set these values for local Vite development:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

For production, set:

```env
VITE_API_BASE_URL=https://api.example.com/api/v1
```

`src/lib/apiClient.js` reads the current Supabase session and attaches `Authorization: Bearer <access_token>` to every API request. When `VITE_API_BASE_URL` is absent, the existing browser-storage workflow remains available as a temporary compatibility mode.

## API endpoints

All business endpoints require authentication.

- `GET /api/v1/auth/me`
- `GET /api/v1/themes`
- `GET /api/v1/themes/{themeCode}`
- `GET /api/v1/questions?themeCode=&function=&isoStandard=&search=&page=&pageSize=`
- `GET /api/v1/questions/{questionKey}`
- `GET|POST /api/v1/workspaces`
- `GET|PUT|DELETE /api/v1/workspaces/{workspaceId}`
- `PATCH /api/v1/workspaces/{workspaceId}/status`
- `GET /api/v1/workspaces/{workspaceId}/questions`
- `GET /api/v1/workspaces/{workspaceId}/assessments`
- `GET|PUT /api/v1/workspaces/{workspaceId}/questions/{questionKey}/assessment`
- `GET|POST /api/v1/workspaces/{workspaceId}/questions/{questionKey}/evidence`
- `PUT|DELETE /api/v1/workspaces/{workspaceId}/questions/{questionKey}/evidence/{evidenceId}`
- `GET /api/v1/workspaces/{workspaceId}/report`
- `GET /api/v1/workspaces/{workspaceId}/activities`
- `GET /health`

## Example requests

```bash
curl -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  http://localhost:5000/api/v1/questions?themeCode=A01\&isoStandard=ISO%209001
```

```bash
curl -X POST http://localhost:5000/api/v1/workspaces \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceName":"Q3 Audit Readiness",
    "auditPeriodStart":"2026-07-01",
    "auditPeriodEnd":"2026-09-30",
    "auditFunction":"HSSE",
    "auditeeId":"A06",
    "auditeeName":"Manager HSSE",
    "selectedIsoStandards":["All ISO"],
    "workspaceStatus":"Draft",
    "auditorTeam":[]
  }'
```

```bash
curl -X POST http://localhost:5000/api/v1/workspaces/$WORKSPACE_ID/questions/A06-Q01/evidence \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "themeCode":"A06",
    "isoStandard":"ISO 45001",
    "sourceProvider":"OneDrive",
    "sourceUrl":"https://company.sharepoint.com/:u:/e/example",
    "evidenceDescription":"Approved drill report",
    "version":"1.0"
  }'
```

## Docker and deployment

Build from `backend/`:

```bash
docker build -t nr-audit-readiness-api .
docker run --rm -p 8080:8080 --env-file .env nr-audit-readiness-api
```

Deploy this container independently to Azure App Service, Azure Container Apps, Railway, Render, Fly.io, or an internal server. Configure all required environment variables in that platform. Apply the reviewed migration as a controlled release step; the API does not automatically mutate production schema at startup.

## Security notes

- The authenticated user ID comes only from the JWT `sub` claim; request payload user IDs are never trusted as the acting user.
- Workspace reads are limited to creators, assigned members, and administrators. Edits are limited to creators, assigned auditor/editor roles, and administrators.
- Transactional deletes are soft deletes at workspace level; related rows are excluded by query filters.
- Activity logs record transactional changes as JSONB.
- CORS uses an explicit allowlist and never enables `AllowAnyOrigin` with credentials.
- Production exceptions omit stack traces and database details.
- OneDrive integration validates and stores HTTPS sharing links through `IExternalFileProvider`; Microsoft Graph credentials are intentionally not invented.

## Current limitations

- The migration must be applied to the real Supabase database by an operator with the database connection string.
- Microsoft Graph file copying is not implemented; the provider safely stores validated OneDrive sharing URLs.
- Auditor-team management is available through the workspace API contract; the current frontend exposes the core lead-auditor fields and can be extended with a directory picker later.
- Existing browser-only records are not automatically imported into PostgreSQL.
