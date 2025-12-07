"""add users table for RSVP

Revision ID: 686553fdc74a
Revises: 489df4608fd8
Create Date: 2025-12-06 21:32:04.606846

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '686553fdc74a'
down_revision: Union[str, Sequence[str], None] = '489df4608fd8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('has_rsvped', sa.Boolean(), nullable=False),
        sa.Column('original_invitee_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  server_default=sa.text('now()'), nullable=False),
        sa.Column('rsvped_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['original_invitee_id'], ['users.id'],
                                ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('users')
