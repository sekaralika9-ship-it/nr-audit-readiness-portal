#!/usr/bin/env bash

set -euo pipefail

questions_csv="${1:-/Users/macbookair/Downloads/audit_master_questions_rows.csv}"
themes_csv="${2:-/Users/macbookair/Downloads/audit_master_themes_rows.csv}"
psql_bin="${PSQL_BIN:-/Library/PostgreSQL/17/bin/psql}"

for file in "$questions_csv" "$themes_csv"; do
  if [[ ! -f "$file" ]]; then
    echo "CSV file not found: $file" >&2
    exit 1
  fi
done

read -r -s -p "PostgreSQL password: " postgres_password
echo

PGPASSWORD="$postgres_password" "$psql_bin" \
  --host localhost \
  --username postgres \
  --dbname nr_audit_readiness \
  --set ON_ERROR_STOP=1 <<SQL
BEGIN;

\copy audit_master_themes(theme_id,audit_theme,audit_objective,primary_focus,applicable_function,related_iso_standards,created_at) FROM '$themes_csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

\copy audit_master_questions(question_key,theme_code,system_domain,objective,applicable_function,what_to_verify,audit_question,evidence,kpi_review,risk_review,iso_9001,iso_14001,iso_45001,iso_37001,iso_22301,auditor_guideline,evidence_indicator,question_category,applicable_auditee,remarks,created_at) FROM '$questions_csv' WITH (FORMAT csv, HEADER true, ENCODING 'UTF8');

COMMIT;

SELECT 'audit_master_themes' AS table_name, COUNT(*) AS row_count FROM audit_master_themes
UNION ALL
SELECT 'audit_master_questions', COUNT(*) FROM audit_master_questions;
SQL

unset postgres_password
