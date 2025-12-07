"""add_stores_table_and_purchased_status

Revision ID: 489df4608fd8
Revises: 003_ingredient_restructure
Create Date: 2025-12-01 16:30:26.915477

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '489df4608fd8'
down_revision: Union[str, Sequence[str], None] = '003_ingredient_restructure'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create stores table
    op.create_table('stores',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Add store_id and is_purchased to ingredients
    op.add_column('ingredients', sa.Column('store_id', sa.Integer(), nullable=True))
    op.add_column('ingredients', sa.Column('is_purchased', sa.Boolean(), server_default='false', nullable=False))
    op.create_foreign_key('fk_ingredients_store_id', 'ingredients', 'stores', ['store_id'], ['id'], ondelete='SET NULL')

    # Remove old source_store column
    op.drop_column('ingredients', 'source_store')


def downgrade() -> None:
    """Downgrade schema."""
    # Add back source_store column
    op.add_column(
        'ingredients',
        sa.Column('source_store', sa.VARCHAR(length=255), nullable=True)
    )

    # Drop foreign key and new columns
    op.drop_constraint('fk_ingredients_store_id', 'ingredients', type_='foreignkey')
    op.drop_column('ingredients', 'is_purchased')
    op.drop_column('ingredients', 'store_id')

    # Drop stores table
    op.drop_table('stores')
