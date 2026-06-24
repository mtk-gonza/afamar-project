"""add discount fields and online_budget phone

Revision ID: 30dfda91b9db
Revises: 1915821a32dd
Create Date: 2026-06-23 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '30dfda91b9db'
down_revision: Union[str, None] = '1915821a32dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, table):
        return False
    info = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
    return any(row[1] == column for row in info)


def upgrade() -> None:
    if not column_exists("budgets", "discount_percentage"):
        op.add_column("budgets", sa.Column("discount_percentage", sa.Float(), nullable=False, server_default="0.0"))
    if not column_exists("budgets", "discount_fixed_amount"):
        op.add_column("budgets", sa.Column("discount_fixed_amount", sa.Float(), nullable=False, server_default="0.0"))
    if not column_exists("work_orders", "discount_percentage"):
        op.add_column("work_orders", sa.Column("discount_percentage", sa.Float(), nullable=False, server_default="0.0"))
    if not column_exists("work_orders", "discount_fixed_amount"):
        op.add_column("work_orders", sa.Column("discount_fixed_amount", sa.Float(), nullable=False, server_default="0.0"))
    if not column_exists("online_budgets", "phone"):
        op.add_column("online_budgets", sa.Column("phone", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("budgets", "discount_percentage")
    op.drop_column("budgets", "discount_fixed_amount")
    op.drop_column("work_orders", "discount_percentage")
    op.drop_column("work_orders", "discount_fixed_amount")
    op.drop_column("online_budgets", "phone")
