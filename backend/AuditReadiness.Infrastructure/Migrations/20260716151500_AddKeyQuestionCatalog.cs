using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuditReadiness.Infrastructure.Migrations;

[DbContext(typeof(AuditReadinessDbContext))]
[Migration("20260716151500_AddKeyQuestionCatalog")]
public sealed class AddKeyQuestionCatalog : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "audit_location",
            table: "audit_workspaces",
            type: "character varying(250)",
            maxLength: 250,
            nullable: true);

        migrationBuilder.CreateTable(
            name: "audit_key_questions",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                question_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                function_name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                normalized_function_name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                location_name = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: true),
                section = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                question_text = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: false),
                audit_type = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                reference = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                audit_trail = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                expected_evidence = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                sampling_guide = table.Column<string>(type: "character varying(3000)", maxLength: 3000, nullable: true),
                iso_clauses = table.Column<Dictionary<string, string>>(type: "jsonb", nullable: false),
                is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                display_order = table.Column<int>(type: "integer", nullable: false),
                source_document = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_audit_key_questions", x => x.id));

        migrationBuilder.CreateIndex(name: "IX_audit_key_questions_question_key", table: "audit_key_questions", column: "question_key", unique: true);
        migrationBuilder.CreateIndex(name: "IX_audit_key_questions_normalized_function_name_section_display_order", table: "audit_key_questions", columns: ["normalized_function_name", "section", "display_order"]);
        migrationBuilder.CreateIndex(name: "IX_audit_key_questions_location_name_display_order", table: "audit_key_questions", columns: ["location_name", "display_order"]);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "audit_key_questions");
        migrationBuilder.DropColumn(name: "audit_location", table: "audit_workspaces");
    }
}
