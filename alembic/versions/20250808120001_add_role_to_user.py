"""Add role to User model

Revision ID: 20250808120001
Revises: 20250808120000
Create Date: 2025-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250808120001'
down_revision = '20250808120000'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('role', sa.String(), nullable=True, server_default='user'))


def downgrade():
    op.drop_column('users', 'role')
