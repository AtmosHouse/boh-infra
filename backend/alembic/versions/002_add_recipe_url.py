"""Add recipe_url to dishes table.

Revision ID: 002_add_recipe_url
Revises: 001_initial
Create Date: 2024-12-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_add_recipe_url'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('dishes', sa.Column('recipe_url', sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column('dishes', 'recipe_url')

