using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuditReadiness.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialTransactionalSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:uuid-ossp", ",,");

            migrationBuilder.CreateTable(
                name: "audit_workspaces",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    audit_period_start = table.Column<DateOnly>(type: "date", nullable: false),
                    audit_period_end = table.Column<DateOnly>(type: "date", nullable: false),
                    audit_function = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    auditee_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    auditee_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    lead_auditor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    lead_auditor_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    selected_iso_standards = table.Column<string[]>(type: "text[]", nullable: false),
                    workspace_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_workspaces", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "audit_activity_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    action_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    entity_type = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: false),
                    entity_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    old_value = table.Column<string>(type: "jsonb", nullable: true),
                    new_value = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_activity_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_activity_logs_audit_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "audit_workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_evidence",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    theme_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    iso_standard = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    evidence_description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    evidence_category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    source_provider = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    source_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                    storage_url = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    mime_type = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    version = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_evidence", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_evidence_audit_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "audit_workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_question_assessments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    assessment_result = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    checklist_status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    checklist_completed = table.Column<bool>(type: "boolean", nullable: false),
                    auditor_notes = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    auditee_response = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    corrective_action = table.Column<string>(type: "character varying(5000)", maxLength: 5000, nullable: true),
                    assigned_person = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    due_date = table.Column<DateOnly>(type: "date", nullable: true),
                    reviewed_by = table.Column<Guid>(type: "uuid", nullable: true),
                    reviewed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_question_assessments", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_question_assessments_audit_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "audit_workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_workspace_members",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    workspace_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    user_email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    member_role = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_workspace_members", x => x.id);
                    table.ForeignKey(
                        name: "FK_audit_workspace_members_audit_workspaces_workspace_id",
                        column: x => x.workspace_id,
                        principalTable: "audit_workspaces",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_activity_logs_workspace_id_created_at",
                table: "audit_activity_logs",
                columns: new[] { "workspace_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_evidence_uploaded_by",
                table: "audit_evidence",
                column: "uploaded_by");

            migrationBuilder.CreateIndex(
                name: "IX_audit_evidence_workspace_id_question_key",
                table: "audit_evidence",
                columns: new[] { "workspace_id", "question_key" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_question_assessments_workspace_id_assessment_result",
                table: "audit_question_assessments",
                columns: new[] { "workspace_id", "assessment_result" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_question_assessments_workspace_id_question_key",
                table: "audit_question_assessments",
                columns: new[] { "workspace_id", "question_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_workspace_members_user_id",
                table: "audit_workspace_members",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_audit_workspace_members_workspace_id_user_id",
                table: "audit_workspace_members",
                columns: new[] { "workspace_id", "user_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_audit_workspaces_auditee_id_workspace_status",
                table: "audit_workspaces",
                columns: new[] { "auditee_id", "workspace_status" });

            migrationBuilder.CreateIndex(
                name: "IX_audit_workspaces_created_by",
                table: "audit_workspaces",
                column: "created_by");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_activity_logs");

            migrationBuilder.DropTable(
                name: "audit_evidence");

            migrationBuilder.DropTable(
                name: "audit_question_assessments");

            migrationBuilder.DropTable(
                name: "audit_workspace_members");

            migrationBuilder.DropTable(
                name: "audit_workspaces");
        }
    }
}
