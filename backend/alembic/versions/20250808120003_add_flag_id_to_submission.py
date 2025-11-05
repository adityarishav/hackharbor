"""Add flag_id to Submission model

Revision ID: 20250808120003
Revises: 20250808120002
Create Date: 2025-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250808120003'
down_revision = '20250808120002'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('submissions', sa.Column('flag_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        op.f('fk_submissions_flag_id_flags'),
        'submissions', 'flags',
        ['flag_id'], ['id']
    )


def downgrade():
    op.drop_constraint(op.f('fk_submissions_flag_id_flags'), 'submissions', type_='foreignkey')
    op.drop_column('submissions', 'flag_id')
