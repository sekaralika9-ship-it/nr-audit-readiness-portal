# NR Audit Readiness API

The backend is a .NET 8 ASP.NET Core Web API backed by PostgreSQL through EF Core/Npgsql. It owns user accounts with ASP.NET Core Identity, hashes passwords, issues signed JWTs, and authorizes workspace, assessment, evidence, document, and report operations.

## Projects

- `AuditReadiness.Domain`: entities and enums.
- `AuditReadiness.Application`: validated requests, DTOs, and service interfaces.
- `AuditReadiness.Infrastructure`: PostgreSQL mappings, Identity stores, authorization-aware services, and migrations.
- `AuditReadiness.Api`: controllers, JWT authentication, Swagger, CORS, logging, and health checks.
- `AuditReadiness.Tests`: xUnit service, validation, registration, login, and security tests.

## Required configuration

```env
DATABASE_CONNECTION_STRING=Host=localhost;Port=5432;Database=nr_audit_readiness;Username=postgres;Password=replace-me
JWT_SIGNING_KEY=replace-with-at-least-32-random-bytes
JWT_ISSUER=nr-audit-readiness-api
JWT_AUDIENCE=nr-audit-readiness-portal
FRONTEND_URL=http://localhost:5173
ASPNETCORE_URLS=http://0.0.0.0:5000
APPLY_MIGRATIONS=false
```

`DATABASE_CONNECTION_STRING` also accepts a `postgres://` or `postgresql://` URL, including Railway's database URL. Never commit database credentials or the JWT signing key.

## Local commands

```bash
dotnet restore
dotnet ef database update --project AuditReadiness.Infrastructure --startup-project AuditReadiness.Api
dotnet run --project AuditReadiness.Api
dotnet test AuditReadiness.sln -c Release
```

Swagger is available at `http://localhost:5000/swagger`; health status is at `http://localhost:5000/health`.

Create an account with `POST /api/v1/auth/register`, or use the web registration page. To call protected endpoints in Swagger, log in through `POST /api/v1/auth/login`, copy `data.accessToken`, then select **Authorize** and paste the token.

## Main endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET|PUT /api/v1/auth/me`
- `GET /api/v1/themes`
- `GET /api/v1/questions`
- `GET|POST /api/v1/workspaces`
- `GET|PUT|DELETE /api/v1/workspaces/{workspaceId}`
- `GET|PUT /api/v1/workspaces/{workspaceId}/questions/{questionKey}/assessment`
- `GET|POST /api/v1/workspaces/{workspaceId}/questions/{questionKey}/evidence`
- `PUT|DELETE /api/v1/workspaces/{workspaceId}/questions/{questionKey}/evidence/{evidenceId}`
- `GET|POST /api/v1/documents`
- `PUT|DELETE /api/v1/documents/{id}`
- `GET /api/v1/workspaces/{workspaceId}/report`
- `GET /health`

## Railway

Deploy using `backend/Dockerfile` with the service root directory set to `/backend`. Configure:

```env
DATABASE_CONNECTION_STRING=${{Postgres.DATABASE_URL}}
JWT_SIGNING_KEY=<a strong random secret of at least 32 bytes>
JWT_ISSUER=nr-audit-readiness-api
JWT_AUDIENCE=nr-audit-readiness-portal
FRONTEND_URL=https://nr-audit-readiness-portal.vercel.app
ASPNETCORE_URLS=http://0.0.0.0:8080
ASPNETCORE_ENVIRONMENT=Production
APPLY_MIGRATIONS=true
```

`APPLY_MIGRATIONS=true` applies pending EF Core migrations before the API starts. Use it for the current single-instance demo deployment. For a multi-instance production rollout, run migrations as a separate release job.

After deployment, generate a public Railway domain and set the Vercel frontend variable:

```env
VITE_API_BASE_URL=https://your-api.up.railway.app/api/v1
```

The master tables are created by migrations. Import the supplied 13-theme and 218-question CSV files once into a new hosted database before presenting the full question catalog.
