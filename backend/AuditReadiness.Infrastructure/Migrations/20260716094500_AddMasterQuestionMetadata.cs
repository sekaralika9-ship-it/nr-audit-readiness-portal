using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AuditReadiness.Infrastructure.Migrations;

[DbContext(typeof(AuditReadinessDbContext))]
[Migration("20260716094500_AddMasterQuestionMetadata")]
public sealed class AddMasterQuestionMetadata : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "evidence_indicator", table: "audit_master_questions", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(name: "question_category", table: "audit_master_questions", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(name: "applicable_auditee", table: "audit_master_questions", type: "text", nullable: true);
        migrationBuilder.AddColumn<string>(name: "remarks", table: "audit_master_questions", type: "text", nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "evidence_indicator", table: "audit_master_questions");
        migrationBuilder.DropColumn(name: "question_category", table: "audit_master_questions");
        migrationBuilder.DropColumn(name: "applicable_auditee", table: "audit_master_questions");
        migrationBuilder.DropColumn(name: "remarks", table: "audit_master_questions");
    }
}
