"""Restructure ingredients with Ingredient and IngredientInstance tables.

Revision ID: 003_ingredient_restructure
Revises: 002_add_recipe_url
Create Date: 2024-12-01

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '003_ingredient_restructure'
down_revision: Union[str, None] = '002_add_recipe_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create ingredients table
    op.create_table(
        'ingredients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('source_store', sa.String(length=255), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=False, server_default='each'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create ingredient_instances table
    op.create_table(
        'ingredient_instances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ingredient_id', sa.Integer(), nullable=False),
        sa.Column('dish_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredients.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dish_id'], ['dishes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_ingredients_name', 'ingredients', ['name'])
    op.create_index('ix_ingredient_instances_ingredient_id', 'ingredient_instances', ['ingredient_id'])
    op.create_index('ix_ingredient_instances_dish_id', 'ingredient_instances', ['dish_id'])

    # Drop old parsed_ingredients table
    op.drop_table('parsed_ingredients')


def downgrade() -> None:
    # Recreate parsed_ingredients table
    op.create_table(
        'parsed_ingredients',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('dish_id', sa.Integer(), nullable=False),
        sa.Column('original_text', sa.Text(), nullable=False),
        sa.Column('ingredient_name', sa.String(length=255), nullable=False),
        sa.Column('quantity', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['dish_id'], ['dishes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Drop indexes
    op.drop_index('ix_ingredient_instances_dish_id', 'ingredient_instances')
    op.drop_index('ix_ingredient_instances_ingredient_id', 'ingredient_instances')
    op.drop_index('ix_ingredients_name', 'ingredients')

    # Drop new tables
    op.drop_table('ingredient_instances')
    op.drop_table('ingredients')

