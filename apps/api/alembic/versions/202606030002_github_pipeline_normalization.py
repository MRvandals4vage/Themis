"""github pipeline normalization

Revision ID: 202606030002
Revises: 202606030001
Create Date: 2026-06-03
"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "202606030002"
down_revision = "202606030001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    provider = postgresql.ENUM(name="pipeline_provider", create_type=False)
    op.add_column("pipeline_runs", sa.Column("provider", provider, nullable=True))
    op.add_column("pipeline_runs", sa.Column("repository", sa.String(length=512), nullable=True))
    op.add_column("pipeline_runs", sa.Column("workflow_name", sa.String(length=255), nullable=True))
    op.add_column("pipeline_runs", sa.Column("conclusion", sa.String(length=80), nullable=True))
    op.add_column(
        "pipeline_runs", sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True)
    )

    op.execute("UPDATE pipeline_runs SET provider = 'GITHUB_ACTIONS' WHERE provider IS NULL")
    op.execute("UPDATE pipeline_runs SET repository = 'unknown/unknown' WHERE repository IS NULL")
    op.execute("UPDATE pipeline_runs SET workflow_name = external_id WHERE workflow_name IS NULL")
    op.execute("UPDATE pipeline_runs SET completed_at = finished_at WHERE completed_at IS NULL")

    op.alter_column("pipeline_runs", "provider", nullable=False)
    op.alter_column("pipeline_runs", "repository", nullable=False)
    op.alter_column("pipeline_runs", "workflow_name", nullable=False)
    op.create_index(
        "ix_pipeline_runs_provider_repository_completed",
        "pipeline_runs",
        ["provider", "repository", "completed_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_pipeline_runs_provider_repository_completed", table_name="pipeline_runs")
    op.drop_column("pipeline_runs", "completed_at")
    op.drop_column("pipeline_runs", "conclusion")
    op.drop_column("pipeline_runs", "workflow_name")
    op.drop_column("pipeline_runs", "repository")
    op.drop_column("pipeline_runs", "provider")
