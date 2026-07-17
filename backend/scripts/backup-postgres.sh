#!/usr/bin/env bash
set -euo pipefail

database_url="${DATABASE_PUBLIC_URL:-${DATABASE_URL:-}}"
encryption_password="${BACKUP_ENCRYPTION_PASSWORD:-}"
backup_directory="${BACKUP_DIRECTORY:-./backups}"

if [[ -z "$database_url" ]]; then
  echo "DATABASE_PUBLIC_URL or DATABASE_URL is required." >&2
  exit 1
fi

if [[ -z "$encryption_password" ]]; then
  echo "BACKUP_ENCRYPTION_PASSWORD is required so database exports are never stored unencrypted." >&2
  exit 1
fi

command -v pg_dump >/dev/null || { echo "pg_dump is required." >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required." >&2; exit 1; }

mkdir -p "$backup_directory"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
output="$backup_directory/nr-audit-readiness-$timestamp.dump.enc"

pg_dump --format=custom --no-owner --no-privileges "$database_url" \
  | openssl enc -aes-256-cbc -salt -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSWORD -out "$output"

chmod 600 "$output"
echo "Encrypted PostgreSQL backup created: $output"
