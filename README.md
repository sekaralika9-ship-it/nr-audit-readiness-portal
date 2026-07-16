# NR Audit Readiness Portal

Enterprise audit-readiness workspace built with React/Vite, an ASP.NET Core 8 API, and PostgreSQL. Authentication is owned by the API through ASP.NET Core Identity and signed JWTs.

## Local development

Start PostgreSQL, then configure `backend/.env` from `backend/.env.example`. From `backend/`:

```bash
export DATABASE_CONNECTION_STRING='Host=localhost;Port=5432;Database=nr_audit_readiness;Username=postgres;Password=your-password'
export JWT_SIGNING_KEY='replace-with-a-random-secret-of-at-least-32-bytes'
export ASPNETCORE_URLS='http://localhost:5000'
dotnet ef database update --project AuditReadiness.Infrastructure --startup-project AuditReadiness.Api
dotnet run --project AuditReadiness.Api
```

In another terminal, from the repository root:

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`. New accounts are stored in PostgreSQL and receive an eight-hour portal JWT.

## Verification

```bash
npm run lint
npm run test:run
npm run build
cd backend && dotnet test AuditReadiness.sln -c Release
```

Authenticated Playwright tests use a dedicated non-production portal account. Copy `.env.e2e.example` to `.env.e2e.local`, fill the credentials, then run `npm run test:e2e`.

See [backend/README.md](backend/README.md) for API endpoints, migrations, and Railway deployment variables.
