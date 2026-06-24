"""add new models and columns

Revision ID: 85179924c32e
Revises: 8d2e482a0a39
Create Date: 2026-06-19 01:12:40.483824
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '85179924c32e'
down_revision: Union[str, None] = '8d2e482a0a39'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def table_exists(name: str) -> bool:
    conn = op.get_bind()
    return conn.dialect.has_table(conn, name)


def column_exists(table: str, column: str) -> bool:
    conn = op.get_bind()
    if not conn.dialect.has_table(conn, table):
        return False
    info = conn.execute(sa.text(f"PRAGMA table_info({table})")).fetchall()
    return any(row[1] == column for row in info)


def add_column_if_not_exists(table: str, column_def):
    if not column_exists(table, column_def.name):
        op.add_column(table, column_def)


def upgrade() -> None:
    # New tables
    if not table_exists('measurements'):
        op.create_table('measurements',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('client_name', sa.String(length=200), nullable=True),
            sa.Column('client_phone', sa.String(length=50), nullable=True),
            sa.Column('client_address', sa.Text(), nullable=True),
            sa.Column('scheduled_date', sa.DateTime(), nullable=True),
            sa.Column('scheduled_time', sa.String(length=10), nullable=True),
            sa.Column('notes', sa.Text(), nullable=True),
            sa.Column('sketch_data', sa.Text(), nullable=True),
            sa.Column('photos_data', sa.Text(), nullable=True),
            sa.Column('status', sa.String(length=20), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_measurements_id'), 'measurements', ['id'], unique=False)

    if not table_exists('online_budgets'):
        op.create_table('online_budgets',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('number', sa.String(length=20), nullable=False),
            sa.Column('client_name', sa.String(length=200), nullable=True),
            sa.Column('work_type', sa.String(length=200), nullable=True),
            sa.Column('date', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=30), nullable=False),
            sa.Column('usd_rate', sa.Float(), nullable=False),
            sa.Column('items_data', sa.Text(), nullable=True),
            sa.Column('total_net_ars', sa.Float(), nullable=False),
            sa.Column('total_net_usd', sa.Float(), nullable=False),
            sa.Column('total_consolidated', sa.Float(), nullable=False),
            sa.Column('pool_id', sa.Integer(), nullable=True),
            sa.Column('pool_price', sa.Float(), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('updated_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['pool_id'], ['pool_stock.id'], ),
            sa.PrimaryKeyConstraint('id'),
            sa.UniqueConstraint('number')
        )
        op.create_index(op.f('ix_online_budgets_id'), 'online_budgets', ['id'], unique=False)

    if not table_exists('budget_adicionales'):
        op.create_table('budget_adicionales',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('budget_id', sa.Integer(), nullable=False),
            sa.Column('concept', sa.String(length=255), nullable=True),
            sa.Column('detail', sa.String(length=255), nullable=True),
            sa.Column('quantity', sa.Integer(), nullable=False),
            sa.Column('unit_price', sa.Float(), nullable=False),
            sa.Column('total', sa.Float(), nullable=False),
            sa.ForeignKeyConstraint(['budget_id'], ['budgets.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_budget_adicionales_id'), 'budget_adicionales', ['id'], unique=False)

    if not table_exists('price_history'):
        op.create_table('price_history',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('material_id', sa.Integer(), nullable=False),
            sa.Column('material_name', sa.String(length=200), nullable=True),
            sa.Column('price_m2', sa.Float(), nullable=False),
            sa.Column('date', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
            sa.ForeignKeyConstraint(['material_id'], ['materials.id'], ),
            sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_price_history_id'), 'price_history', ['id'], unique=False)

    # New columns on budget_items
    add_column_if_not_exists('budget_items', sa.Column('sector', sa.String(length=100), nullable=True))
    add_column_if_not_exists('budget_items', sa.Column('unit_length', sa.String(length=5), server_default='cm', nullable=False))
    add_column_if_not_exists('budget_items', sa.Column('unit_width', sa.String(length=5), server_default='cm', nullable=False))
    add_column_if_not_exists('budget_items', sa.Column('length', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budget_items', sa.Column('width', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budget_items', sa.Column('m2', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budget_items', sa.Column('price_m2', sa.Float(), server_default='0', nullable=False))

    # New columns on budgets
    add_column_if_not_exists('budgets', sa.Column('material_price_m2', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('material_price_m2_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('materials_data', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('usd_rate', sa.Float(), server_default='1000', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('subtotal_materials', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('subtotal_services', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('transport', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('installation', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('discount', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('subtotal_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('transport_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('total_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('deposit_received', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('deposit_currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('deposit_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('balance_due', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('balance_due_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('balance_paid', sa.Boolean(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('balance_paid_at', sa.DateTime(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('installments', sa.Integer(), server_default='1', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('priority', sa.String(length=20), server_default='Normal', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('date', sa.DateTime(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('delivery_date', sa.DateTime(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('digital_signature', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('signed_at', sa.DateTime(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('approval_date', sa.DateTime(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('design_observations', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('important_observations', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('fabrication_details', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('pool_id', sa.Integer(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('pool_price', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('pool_currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('pool_image', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('stock_deducted', sa.Boolean(), server_default='0', nullable=False))
    add_column_if_not_exists('budgets', sa.Column('pools_data', sa.Text(), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('snapshot_name', sa.String(length=200), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('snapshot_phone', sa.String(length=50), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('snapshot_email', sa.String(length=200), nullable=True))
    add_column_if_not_exists('budgets', sa.Column('snapshot_address', sa.Text(), nullable=True))

    # Migrate data from old columns
    if column_exists('budgets', 'usd_reference') and column_exists('budgets', 'usd_rate'):
        op.execute("UPDATE budgets SET usd_rate = COALESCE(usd_reference, 1000)")
    if column_exists('budgets', 'shipping') and column_exists('budgets', 'transport'):
        op.execute("UPDATE budgets SET transport = COALESCE(shipping, 0)")

    # Drop old columns if they exist
    if column_exists('budgets', 'usd_reference'):
        with op.batch_alter_table('budgets') as batch_op:
            batch_op.drop_column('usd_reference')
    if column_exists('budgets', 'shipping'):
        with op.batch_alter_table('budgets') as batch_op:
            batch_op.drop_column('shipping')

    # New columns on materials
    add_column_if_not_exists('materials', sa.Column('price_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('materials', sa.Column('currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('materials', sa.Column('supplier', sa.String(length=200), nullable=True))
    add_column_if_not_exists('materials', sa.Column('stock_available', sa.Integer(), server_default='0', nullable=False))

    # New columns on pool_stock
    add_column_if_not_exists('pool_stock', sa.Column('price', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('pool_stock', sa.Column('price_usd', sa.Float(), server_default='0', nullable=False))

    # New columns on work_orders
    add_column_if_not_exists('work_orders', sa.Column('origin', sa.String(length=30), server_default='Manual', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('material_price_m2', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('materials_data', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('finish', sa.String(length=100), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('usd_rate', sa.Float(), server_default='1000', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('subtotal', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('transport', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('installation', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('discount', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('total', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('subtotal_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('transport_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('total_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('deposit_currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('deposit_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('balance_due_usd', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('balance_paid', sa.Boolean(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('balance_paid_at', sa.DateTime(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('payment_method', sa.String(length=50), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('installments', sa.Integer(), server_default='1', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('fabrication_details', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('budgeted_details', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('pool_id', sa.Integer(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('pool_price', sa.Float(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('pool_currency', sa.String(length=5), server_default='ARS', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('pool_image', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('stock_deducted', sa.Boolean(), server_default='0', nullable=False))
    add_column_if_not_exists('work_orders', sa.Column('pools_data', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('adicionales_data', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('design_observations', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('important_observations', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('snapshot_name', sa.String(length=200), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('snapshot_phone', sa.String(length=50), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('snapshot_email', sa.String(length=200), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('snapshot_address', sa.Text(), nullable=True))
    add_column_if_not_exists('work_orders', sa.Column('date', sa.DateTime(), nullable=True))


def downgrade() -> None:
    pass
