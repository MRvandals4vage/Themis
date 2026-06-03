"""add_category_to_incident_analysis

Revision ID: a76682fa86f6
Revises: 202606030002
Create Date: 2026-06-03 19:23:54.186601
"""

import sqlalchemy as sa

from alembic import op

revision = "a76682fa86f6"
down_revision = "202606030002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("incident_analysis", sa.Column("category", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("incident_analysis", "category")
