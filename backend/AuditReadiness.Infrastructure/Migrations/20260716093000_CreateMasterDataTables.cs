using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AuditReadiness.Infrastructure.Migrations;

[DbContext(typeof(AuditReadinessDbContext))]
[Migration("20260716093000_CreateMasterDataTables")]
public sealed class CreateMasterDataTables : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "audit_master_themes",
            columns: table => new
            {
                theme_id = table.Column<string>(type: "text", nullable: false),
                audit_theme = table.Column<string>(type: "text", nullable: false),
                audit_objective = table.Column<string>(type: "text", nullable: true),
                primary_focus = table.Column<string>(type: "text", nullable: true),
                applicable_function = table.Column<string>(type: "text", nullable: true),
                related_iso_standards = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_master_themes", x => x.theme_id);
            });

        migrationBuilder.CreateTable(
            name: "audit_master_questions",
            columns: table => new
            {
                question_key = table.Column<string>(type: "text", nullable: false),
                theme_code = table.Column<string>(type: "text", nullable: false),
                system_domain = table.Column<string>(type: "text", nullable: true),
                objective = table.Column<string>(type: "text", nullable: true),
                applicable_function = table.Column<string>(type: "text", nullable: true),
                what_to_verify = table.Column<string>(type: "text", nullable: true),
                audit_question = table.Column<string>(type: "text", nullable: false),
                evidence = table.Column<string>(type: "text", nullable: true),
                kpi_review = table.Column<string>(type: "text", nullable: true),
                risk_review = table.Column<string>(type: "text", nullable: true),
                iso_9001 = table.Column<string>(type: "text", nullable: true),
                iso_14001 = table.Column<string>(type: "text", nullable: true),
                iso_45001 = table.Column<string>(type: "text", nullable: true),
                iso_37001 = table.Column<string>(type: "text", nullable: true),
                iso_22301 = table.Column<string>(type: "text", nullable: true),
                auditor_guideline = table.Column<string>(type: "text", nullable: true),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_audit_master_questions", x => x.question_key);
            });

        migrationBuilder.CreateIndex(
            name: "IX_audit_master_questions_theme_code",
            table: "audit_master_questions",
            column: "theme_code");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "audit_master_questions");
        migrationBuilder.DropTable(name: "audit_master_themes");
    }
}
