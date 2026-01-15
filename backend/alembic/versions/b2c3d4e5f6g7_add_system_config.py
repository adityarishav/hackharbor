"""add system_config table

Revision ID: b2c3d4e5f6g7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-07 13:36:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6g7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'system_config',
        sa.Column('key', sa.String(), nullable=False),
        sa.Column('value', sa.String(), nullable=True),
        sa.PrimaryKeyConstraint('key')
    )
    op.create_index(op.f('ix_system_config_key'), 'system_config', ['key'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_system_config_key'), table_name='system_config')
    op.drop_table('system_config')
