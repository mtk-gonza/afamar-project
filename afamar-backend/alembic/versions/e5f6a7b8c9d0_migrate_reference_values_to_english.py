"""migrate reference values to english

Revision ID: e5f6a7b8c9d0
Revises: b96f5327d74a
Create Date: 2026-06-25 17:00:00.000000

This migration converts all Spanish status / reference values stored in the
database to their English equivalents.  It is **idempotent** — rows that are
already in English are left untouched.  Existing data on the production server
will be re-mapped in place; column defaults on the ORM models are updated in
the application code at the same time.
"""
from alembic import op
import sqlalchemy as sa


revision: str = "e5f6a7b8c9d0"
down_revision: str | None = "b96f5327d74a"
branch_labels = None
depends_on = None


# Map of old Spanish value -> new English value
BUDGET_STATUS_MAP = {
    "PENDIENTE": "PENDING",
    "ONLINE": "ONLINE",
    "APROBADO": "APPROVED",
    "RECHAZADO": "REJECTED",
    "CONVERTIDO A OT": "CONVERTED_TO_OT",
    # already-english values
    "pending": "PENDING",
    "approved": "APPROVED",
    "rejected": "REJECTED",
    "converted_to_order": "CONVERTED_TO_OT",
}

WORK_ORDER_STATUS_MAP = {
    "MEDICION": "MEASUREMENT",
    "TALLER": "WORKSHOP",
    "TERMINADA": "FINISHED",
    "ENTREGADA": "DELIVERED",
    "CANCELADO": "CANCELLED",
    "measurement": "MEASUREMENT",
    "budgeted": "WORKSHOP",
    "in_production": "WORKSHOP",
    "finished": "FINISHED",
    "delivered": "DELIVERED",
    "cancelled": "CANCELLED",
}

PAYMENT_METHOD_MAP = {
    "EFECTIVO": "CASH",
    "TRANSFERENCIA": "TRANSFER",
    "TARJETA DE CRÉDITO": "CREDIT_CARD",
    "TARJETA DE DÉBITO": "DEBIT_CARD",
    "TARJETA": "CREDIT_CARD",
    "CHEQUE": "CHECK",
    "MIXTO": "MIXED",
    "Efectivo": "CASH",
    "Transferencia": "TRANSFER",
    "Tarjeta": "CREDIT_CARD",
    "cash": "CASH",
    "card": "CREDIT_CARD",
}

PRIORITY_MAP = {
    "Urgente": "URGENT",
    "Alta": "HIGH",
    "Normal": "NORMAL",
    "Baja": "LOW",
    "urgent": "URGENT",
    "high": "HIGH",
    "normal": "NORMAL",
    "low": "LOW",
}


def _remap_column(table: str, column: str, mapping: dict[str, str]) -> None:
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, table):
        return
    info = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
    cols = {row[1] for row in info}
    if column not in cols:
        return
    for old, new in mapping.items():
        conn.execute(
            sa.text(f"UPDATE {table} SET {column} = :new WHERE {column} = :old"),
            {"new": new, "old": old},
        )


def _remap_reference_table(table: str, mapping: dict[str, str]) -> None:
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, table):
        return
    for old, new in mapping.items():
        conn.execute(
            sa.text(f"UPDATE {table} SET name = :new WHERE name = :old"),
            {"new": new, "old": old},
        )


def upgrade() -> None:
    # 1. Remap data in business tables first
    _remap_column("budgets", "status", BUDGET_STATUS_MAP)
    _remap_column("budgets", "payment_method", PAYMENT_METHOD_MAP)
    _remap_column("budgets", "priority", PRIORITY_MAP)
    _remap_column("work_orders", "status", WORK_ORDER_STATUS_MAP)
    _remap_column("work_orders", "payment_method", PAYMENT_METHOD_MAP)
    _remap_column("work_orders", "priority", PRIORITY_MAP)
    _remap_column("online_budgets", "status", BUDGET_STATUS_MAP)
    _remap_column("online_budgets", "payment_method", PAYMENT_METHOD_MAP)
    _remap_column("measurements", "status", {
        "PENDIENTE": "PENDING",
        "REALIZADO": "DONE",
        "CANCELADO": "CANCELLED",
    })
    _remap_column("cash_movements", "payment_method", PAYMENT_METHOD_MAP)
    _remap_column("cash_movements", "expense_type", {
        "Gasto": "EXPENSE",
        "Transferencia Banco": "BANK_TRANSFER",
        "Bank Transfer": "BANK_TRANSFER",
    })

    # 2. Remap the reference table names
    _remap_reference_table("budget_statuses", BUDGET_STATUS_MAP)
    _remap_reference_table("work_order_statuses", WORK_ORDER_STATUS_MAP)
    _remap_reference_table("payment_methods", PAYMENT_METHOD_MAP)
    _remap_reference_table("priority_levels", PRIORITY_MAP)

    # 3. Labels stay in Spanish — they are display-only values consumed by the
    #    frontend.  Only `name` (the machine-readable key) needs to be English.


def downgrade() -> None:
    # No downgrade — going back to Spanish values would lose data.
    pass
