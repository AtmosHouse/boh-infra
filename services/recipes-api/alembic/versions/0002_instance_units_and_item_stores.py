"""Add unit to ingredient_instances and store_id to shopping_list_items.

Instances previously stored quantity without a unit, implicitly assuming
the ingredient's base unit — which silently corrupted totals when a dish
entered a different unit. Storing the entered unit lets the shopping
aggregator convert at read time.

Revision ID: 0002_instance_units
Revises: 0001_initial
Create Date: 2026-11-04
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0002_instance_units"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ingredient_instances",
        sa.Column("unit", sa.String(length=50), nullable=False, server_default="each"),
    )
    # Backfill: existing instances were implicitly in the ingredient's base unit
    op.execute(
        "UPDATE ingredient_instances SET unit = "
        "(SELECT unit FROM ingredients WHERE ingredients.id = ingredient_instances.ingredient_id)"
    )

    with op.batch_alter_table("shopping_list_items") as batch_op:
        batch_op.add_column(sa.Column("store_id", sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            "fk_shopping_list_items_store_id", "stores",
            ["store_id"], ["id"], ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("shopping_list_items") as batch_op:
        batch_op.drop_constraint("fk_shopping_list_items_store_id", type_="foreignkey")
        batch_op.drop_column("store_id")

    op.drop_column("ingredient_instances", "unit")
