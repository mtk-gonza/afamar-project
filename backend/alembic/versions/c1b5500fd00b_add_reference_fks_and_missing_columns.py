"""add reference FKs and missing columns

Revision ID: c1b5500fd00b
Revises: 30dfda91b9db
Create Date: 2026-06-23 21:02:09.741905
"""
from datetime import datetime, timezone
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


now_str = datetime.now(timezone.utc).isoformat()


revision: str = "c1b5500fd00b"
down_revision: Union[str, None] = "30dfda91b9db"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, table):
        return False
    info = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
    return any(row[1] == column for row in info)


def _needs_budget_cols() -> bool:
    return any(not column_exists("budgets", c) for c in ["status_id", "payment_method_id", "priority_id", "finish_id"])


def _needs_wo_cols() -> bool:
    return any(not column_exists("work_orders", c) for c in ["status_id", "payment_method_id", "priority_id", "finish_id"])


def seed_reference_table(table: str, values: list[dict]):
    conn = op.get_bind()
    existing = conn.execute(sa.text(f"SELECT COUNT(*) FROM {table}")).scalar()
    if existing > 0:
        return
    for val in values:
        d = dict(val)
        d.setdefault("is_active", 1)
        d.setdefault("created_at", now_str)
        d.setdefault("updated_at", now_str)
        cols = ", ".join(d.keys())
        placeholders = ", ".join(f":{k}" for k in d)
        conn.execute(sa.text(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})"), d)


def upgrade() -> None:
    needs_budget = _needs_budget_cols()
    needs_wo = _needs_wo_cols()

    seed_reference_table("budget_statuses", [
        {"name": "PENDIENTE", "label": "Pendiente", "color": "#f59e0b", "sort_order": 1},
        {"name": "ONLINE", "label": "Online", "color": "#3b82f6", "sort_order": 2},
        {"name": "APROBADO", "label": "Aprobado", "color": "#10b981", "sort_order": 3},
        {"name": "RECHAZADO", "label": "Rechazado", "color": "#ef4444", "sort_order": 4},
        {"name": "CONVERTIDO A OT", "label": "Convertido a OT", "color": "#8b5cf6", "sort_order": 5},
    ])
    seed_reference_table("work_order_statuses", [
        {"name": "MEDICION", "label": "Medici\u00f3n", "color": "#f59e0b", "sort_order": 1},
        {"name": "TALLER", "label": "Taller", "color": "#3b82f6", "sort_order": 2},
        {"name": "TERMINADA", "label": "Terminada", "color": "#10b981", "sort_order": 3},
        {"name": "ENTREGADA", "label": "Entregada", "color": "#6b7280", "sort_order": 4},
        {"name": "CANCELADO", "label": "Cancelado", "color": "#ef4444", "sort_order": 5},
    ])
    seed_reference_table("payment_methods", [
        {"name": "EFECTIVO", "label": "Efectivo", "sort_order": 1},
        {"name": "TRANSFERENCIA", "label": "Transferencia", "sort_order": 2},
        {"name": "TARJETA DE CR\u00c9DITO", "label": "Tarjeta de Cr\u00e9dito", "sort_order": 3},
        {"name": "TARJETA DE D\u00c9BITO", "label": "Tarjeta de D\u00e9bito", "sort_order": 4},
        {"name": "CHEQUE", "label": "Cheque", "sort_order": 5},
        {"name": "MIXTO", "label": "Mixto", "sort_order": 6},
    ])
    seed_reference_table("priority_levels", [
        {"name": "Urgente", "label": "Urgente", "color": "#ef4444", "sort_order": 1},
        {"name": "Alta", "label": "Alta", "color": "#f97316", "sort_order": 2},
        {"name": "Normal", "label": "Normal", "color": "#3b82f6", "sort_order": 3},
        {"name": "Baja", "label": "Baja", "color": "#6b7280", "sort_order": 4},
    ])
    seed_reference_table("finish_types", [
        {"name": "Pulido", "label": "Pulido", "sort_order": 1},
        {"name": "Mate", "label": "Mate", "sort_order": 2},
        {"name": "Apomazado", "label": "Apomazado", "sort_order": 3},
        {"name": "Cepillado", "label": "Cepillado", "sort_order": 4},
        {"name": "Arenado", "label": "Arenado", "sort_order": 5},
        {"name": "Encerado", "label": "Encerado", "sort_order": 6},
    ])

    if needs_budget:
        with op.batch_alter_table("budgets") as batch_op:
            if not column_exists("budgets", "status_id"):
                batch_op.add_column(sa.Column("status_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_budgets_status_id", "budget_statuses", ["status_id"], ["id"])
            if not column_exists("budgets", "payment_method_id"):
                batch_op.add_column(sa.Column("payment_method_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_budgets_payment_method_id", "payment_methods", ["payment_method_id"], ["id"])
            if not column_exists("budgets", "priority_id"):
                batch_op.add_column(sa.Column("priority_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_budgets_priority_id", "priority_levels", ["priority_id"], ["id"])
            if not column_exists("budgets", "finish_id"):
                batch_op.add_column(sa.Column("finish_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_budgets_finish_id", "finish_types", ["finish_id"], ["id"])

    if needs_wo:
        with op.batch_alter_table("work_orders") as batch_op:
            if not column_exists("work_orders", "status_id"):
                batch_op.add_column(sa.Column("status_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_work_orders_status_id", "work_order_statuses", ["status_id"], ["id"])
            if not column_exists("work_orders", "payment_method_id"):
                batch_op.add_column(sa.Column("payment_method_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_work_orders_payment_method_id", "payment_methods", ["payment_method_id"], ["id"])
            if not column_exists("work_orders", "priority_id"):
                batch_op.add_column(sa.Column("priority_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_work_orders_priority_id", "priority_levels", ["priority_id"], ["id"])
            if not column_exists("work_orders", "finish_id"):
                batch_op.add_column(sa.Column("finish_id", sa.Integer(), nullable=True))
                batch_op.create_foreign_key("fk_work_orders_finish_id", "finish_types", ["finish_id"], ["id"])


def downgrade() -> None:
    needs_wo = _needs_wo_cols()
    needs_budget = _needs_budget_cols()

    if needs_wo:
        with op.batch_alter_table("work_orders") as batch_op:
            for col in ["status_id", "payment_method_id", "priority_id", "finish_id"]:
                if column_exists("work_orders", col):
                    batch_op.drop_column(col)

    if needs_budget:
        with op.batch_alter_table("budgets") as batch_op:
            for col in ["status_id", "payment_method_id", "priority_id", "finish_id"]:
                if column_exists("budgets", col):
                    batch_op.drop_column(col)
