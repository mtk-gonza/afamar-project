"""add_daily_cash_and_cash_movements

Revision ID: 26893c0fdbc9
Revises: c1b5500fd00b
Create Date: 2026-06-23 21:29:18.544431
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '26893c0fdbc9'
down_revision: Union[str, None] = 'c1b5500fd00b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(name: str) -> bool:
    conn = op.get_bind()
    return conn.dialect.has_table(conn, name)


def upgrade() -> None:
    if not table_exists("daily_cash"):
        op.create_table(
            "daily_cash",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("date", sa.Date(), unique=True, nullable=False, index=True),
            sa.Column("previous_balance", sa.Float(), nullable=False, server_default="0"),
            sa.Column("total_income", sa.Float(), nullable=False, server_default="0"),
            sa.Column("total_expenses", sa.Float(), nullable=False, server_default="0"),
            sa.Column("total_sum", sa.Float(), nullable=False, server_default="0"),
            sa.Column("current_balance", sa.Float(), nullable=False, server_default="0"),
            sa.Column("real_cash", sa.Float(), nullable=False, server_default="0"),
            sa.Column("is_closed", sa.Boolean(), nullable=False, server_default="0"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
        )

    if not table_exists("cash_movements"):
        op.create_table(
            "cash_movements",
            sa.Column("id", sa.Integer(), primary_key=True, index=True),
            sa.Column("daily_cash_id", sa.Integer(), sa.ForeignKey("daily_cash.id"), nullable=False),
            sa.Column("type", sa.String(10), nullable=False),
            sa.Column("amount", sa.Float(), nullable=False),
            sa.Column("description", sa.String(255), nullable=False, server_default=""),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("order_id", sa.Integer(), nullable=True),
            sa.Column("order_number", sa.String(50), nullable=True),
            sa.Column("order_total", sa.Float(), nullable=True),
            sa.Column("client_name", sa.String(255), nullable=True),
            sa.Column("payment_method", sa.String(50), nullable=True),
            sa.Column("folder_status", sa.String(50), nullable=True),
            sa.Column("remaining_balance", sa.Float(), nullable=True),
            sa.Column("expense_type", sa.String(50), nullable=True),
        )


def downgrade() -> None:
    if table_exists("cash_movements"):
        op.drop_table("cash_movements")
    if table_exists("daily_cash"):
        op.drop_table("daily_cash")
