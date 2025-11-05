"""Merge heads for generalized machine

Revision ID: 8298cea42fdd
Revises: 0a29b7837bcb, 8b7c6d5e4f3a
Create Date: 2025-08-10 21:49:08.836889

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8298cea42fdd'
down_revision: Union[str, Sequence[str], None] = ('0a29b7837bcb', '8b7c6d5e4f3a')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
