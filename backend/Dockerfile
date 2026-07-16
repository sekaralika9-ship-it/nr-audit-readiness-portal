FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY AuditReadiness.Api/AuditReadiness.Api.csproj AuditReadiness.Api/
COPY AuditReadiness.Application/AuditReadiness.Application.csproj AuditReadiness.Application/
COPY AuditReadiness.Domain/AuditReadiness.Domain.csproj AuditReadiness.Domain/
COPY AuditReadiness.Infrastructure/AuditReadiness.Infrastructure.csproj AuditReadiness.Infrastructure/
RUN dotnet restore AuditReadiness.Api/AuditReadiness.Api.csproj
COPY . .
RUN dotnet publish AuditReadiness.Api/AuditReadiness.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0
EXPOSE 8080
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "AuditReadiness.Api.dll"]
