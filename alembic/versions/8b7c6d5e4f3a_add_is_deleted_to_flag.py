"""Add is_deleted to Flag model

Revision ID: 8b7c6d5e4f3a
Revises: 7ad5bc03970d
Create Date: 2025-08-10 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8b7c6d5e4f3a'
down_revision = '7ad5bc03970d'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('flags', sa.Column('is_deleted', sa.Boolean(), nullable=False, server_default=sa.text('false')))


def downgrade():
    op.drop_column('flags', 'is_deleted')
