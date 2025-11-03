"""Add category and difficulty to Machine

Revision ID: 20250808120000
Revises: cb53490fac83
Create Date: 2025-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250808120000'
down_revision = 'cb53490fac83'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('machines', sa.Column('category', sa.String(), nullable=True))
    op.add_column('machines', sa.Column('difficulty', sa.String(), nullable=True))


def downgrade():
    op.drop_column('machines', 'difficulty')
    op.drop_column('machines', 'category')
