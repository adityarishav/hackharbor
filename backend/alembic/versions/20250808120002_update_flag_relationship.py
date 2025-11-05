"""Update Flag relationship in Machine

Revision ID: 20250808120002
Revises: 20250808120001
Create Date: 2025-08-08 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '20250808120002'
down_revision = '20250808120001'
branch_labels = None
depends_on = None


def upgrade():
    # No direct column changes, this migration is primarily for relationship cascade
    pass


def downgrade():
    # No direct column changes, this migration is primarily for relationship cascade
    pass
