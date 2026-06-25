"""add_product_photos

Revision ID: b96f5327d74a
Revises: 26893c0fdbc9
Create Date: 2026-06-24 23:51:43.810701
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'b96f5327d74a'
down_revision: Union[str, None] = '26893c0fdbc9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_photos",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("title", sa.String(200), nullable=False, server_default=""),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("product_photos")
