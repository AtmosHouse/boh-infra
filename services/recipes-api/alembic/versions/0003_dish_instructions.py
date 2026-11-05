"""Add instructions column to dishes.

Revision ID: 0003_dish_instructions
Revises: 0002_instance_units
Create Date: 2026-11-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003_dish_instructions"
down_revision: Union[str, None] = "0002_instance_units"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("dishes", sa.Column("instructions", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("dishes", "instructions")
