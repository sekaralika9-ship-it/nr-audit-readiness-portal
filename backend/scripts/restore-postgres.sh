#!/usr/bin/env bash
set -euo pipefail

database_url="${RESTORE_DATABASE_URL:-}"
encryption_password="${BACKUP_ENCRYPTION_PASSWORD:-}"
backup_file="${1:-}"

if [[ "${CONFIRM_RESTORE:-}" != "RESTORE_NR_AUDIT_DATABASE" ]]; then
  echo "Set CONFIRM_RESTORE=RESTORE_NR_AUDIT_DATABASE to acknowledge the destructive restore operation." >&2
  exit 1
fi

if [[ -z "$database_url" || -z "$encryption_password" || -z "$backup_file" ]]; then
  echo "RESTORE_DATABASE_URL, BACKUP_ENCRYPTION_PASSWORD, and the encrypted backup path are required." >&2
  exit 1
fi

if [[ ! -f "$backup_file" ]]; then
  echo "Backup file not found: $backup_file" >&2
  exit 1
fi

command -v pg_restore >/dev/null || { echo "pg_restore is required." >&2; exit 1; }
command -v openssl >/dev/null || { echo "openssl is required." >&2; exit 1; }

openssl enc -d -aes-256-cbc -pbkdf2 -pass env:BACKUP_ENCRYPTION_PASSWORD -in "$backup_file" \
  | pg_restore --clean --if-exists --no-owner --no-privileges --dbname="$database_url"

echo "PostgreSQL restore completed."
