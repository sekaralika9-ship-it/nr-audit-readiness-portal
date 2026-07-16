using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AuditReadiness.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPortalDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "audit_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    title = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    function = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    file_path = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: true),
                    file_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    file_type = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    file_size = table.Column<long>(type: "bigint", nullable: true),
                    status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    uploaded_by = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_documents", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_audit_documents_created_at",
                table: "audit_documents",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_audit_documents_user_id",
                table: "audit_documents",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_documents");
        }
    }
}
