"""initial schema

Revision ID: 202606030001
Revises:
Create Date: 2026-06-03
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "202606030001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    user_role = postgresql.ENUM("OWNER", "ADMIN", "ENGINEER", "VIEWER", name="user_role")
    provider = postgresql.ENUM("GITHUB_ACTIONS", "GITLAB_CI", "JENKINS", name="pipeline_provider")
    run_status = postgresql.ENUM(
        "FAILED", "SUCCESS", "RUNNING", "CANCELLED", name="pipeline_run_status"
    )
    severity = postgresql.ENUM("LOW", "MEDIUM", "HIGH", "CRITICAL", name="incident_severity")
    incident_status = postgresql.ENUM(
        "OPEN", "INVESTIGATING", "RESOLVED", "ARCHIVED", name="incident_status"
    )
    agent_status = postgresql.ENUM(
        "QUEUED", "RUNNING", "SUCCEEDED", "FAILED", name="agent_execution_status"
    )
    for enum in [user_role, provider, run_status, severity, incident_status, agent_status]:
        enum.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "organizations",
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )
    op.create_index("ix_organizations_slug", "organizations", ["slug"])

    op.create_table(
        "users",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "repositories",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("provider", provider, nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("url", sa.String(length=1024), nullable=False),
        sa.Column("default_branch", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_repositories_org_provider_external",
        "repositories",
        ["organization_id", "provider", "external_id"],
    )

    op.create_table(
        "pipelines",
        sa.Column("repository_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("provider", provider, nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("config_path", sa.String(length=1024), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["repository_id"], ["repositories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pipelines_repository_name", "pipelines", ["repository_id", "name"])

    op.create_table(
        "pipeline_runs",
        sa.Column("pipeline_id", sa.UUID(), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("branch", sa.String(length=255), nullable=False),
        sa.Column("commit_sha", sa.String(length=64), nullable=False),
        sa.Column("status", run_status, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("logs_url", sa.String(length=1024), nullable=True),
        sa.Column("raw_payload", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["pipeline_id"], ["pipelines.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pipeline_runs_external_id", "pipeline_runs", ["external_id"])
    op.create_index(
        "ix_pipeline_runs_pipeline_status_started",
        "pipeline_runs",
        ["pipeline_id", "status", "started_at"],
    )

    op.create_table(
        "incidents",
        sa.Column("pipeline_run_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("severity", severity, nullable=False),
        sa.Column("status", incident_status, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["pipeline_run_id"], ["pipeline_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("pipeline_run_id"),
    )
    op.create_index(
        "ix_incidents_status_severity_created", "incidents", ["status", "severity", "created_at"]
    )

    op.create_table(
        "incident_analysis",
        sa.Column("incident_id", sa.UUID(), nullable=False),
        sa.Column("root_cause", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Integer(), nullable=False),
        sa.Column("similar_incidents", sa.JSON(), nullable=False),
        sa.Column("remediation", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("incident_id"),
    )
    op.create_table(
        "agent_executions",
        sa.Column("incident_id", sa.UUID(), nullable=False),
        sa.Column("agent_name", sa.String(length=120), nullable=False),
        sa.Column("status", agent_status, nullable=False),
        sa.Column("input_payload", sa.JSON(), nullable=False),
        sa.Column("output_payload", sa.JSON(), nullable=False),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_agent_executions_incident_agent_status",
        "agent_executions",
        ["incident_id", "agent_name", "status"],
    )

    op.create_table(
        "embeddings",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("collection_name", sa.String(length=120), nullable=False),
        sa.Column("external_id", sa.String(length=255), nullable=False),
        sa.Column("vector_id", sa.String(length=255), nullable=False),
        sa.Column("content_hash", sa.String(length=128), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vector_id"),
    )
    op.create_index("ix_embeddings_content_hash", "embeddings", ["content_hash"])
    op.create_index(
        "ix_embeddings_org_collection_external",
        "embeddings",
        ["organization_id", "collection_name", "external_id"],
    )

    op.create_table(
        "notifications",
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("incident_id", sa.UUID(), nullable=True),
        sa.Column("channel", sa.String(length=80), nullable=False),
        sa.Column("recipient", sa.String(length=320), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(["incident_id"], ["incidents.id"]),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notifications_org_read_created",
        "notifications",
        ["organization_id", "read_at", "created_at"],
    )


def downgrade() -> None:
    for table in [
        "notifications",
        "embeddings",
        "agent_executions",
        "incident_analysis",
        "incidents",
        "pipeline_runs",
        "pipelines",
        "repositories",
        "users",
        "organizations",
    ]:
        op.drop_table(table)
    for enum_name in [
        "agent_execution_status",
        "incident_status",
        "incident_severity",
        "pipeline_run_status",
        "pipeline_provider",
        "user_role",
    ]:
        postgresql.ENUM(name=enum_name).drop(op.get_bind(), checkfirst=True)
