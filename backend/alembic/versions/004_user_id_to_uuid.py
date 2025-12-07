"""Convert user id from integer to UUID.

Revision ID: 004_user_id_to_uuid
Revises: 686553fdc74a
Create Date: 2024-12-07
"""

import uuid

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004_user_id_to_uuid'
down_revision = '686553fdc74a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Upgrade schema: Convert user id from integer to UUID."""
    # Create new columns for UUID
    op.add_column('users', sa.Column('new_id', sa.String(36), nullable=True))
    op.add_column('users', sa.Column('new_original_invitee_id', sa.String(36), nullable=True))

    # Get connection for data migration
    connection = op.get_bind()

    # Fetch all users and generate UUIDs, storing mapping
    users = connection.execute(sa.text("SELECT id FROM users")).fetchall()
    id_mapping = {}
    for user in users:
        new_uuid = str(uuid.uuid4())
        id_mapping[user[0]] = new_uuid
        connection.execute(
            sa.text("UPDATE users SET new_id = :new_id WHERE id = :old_id"),
            {"new_id": new_uuid, "old_id": user[0]}
        )

    # Update the new_original_invitee_id based on the mapping
    for old_id, new_uuid in id_mapping.items():
        connection.execute(
            sa.text(
                "UPDATE users SET new_original_invitee_id = :new_uuid "
                "WHERE original_invitee_id = :old_id"
            ),
            {"new_uuid": new_uuid, "old_id": old_id}
        )

    # Drop the foreign key constraint first
    op.drop_constraint('users_original_invitee_id_fkey', 'users', type_='foreignkey')

    # Drop old columns and rename new ones
    op.drop_column('users', 'original_invitee_id')
    op.drop_column('users', 'id')

    op.alter_column('users', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('users', 'new_original_invitee_id', new_column_name='original_invitee_id')

    # Add primary key constraint
    op.create_primary_key('users_pkey', 'users', ['id'])

    # Add foreign key constraint
    op.create_foreign_key(
        'users_original_invitee_id_fkey',
        'users', 'users',
        ['original_invitee_id'], ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema: Convert user id back from UUID to integer."""
    # This is a destructive operation - we can't perfectly reverse UUID to int
    # Create new integer columns
    op.add_column('users', sa.Column('new_id', sa.Integer(), nullable=True))
    op.add_column('users', sa.Column('new_original_invitee_id', sa.Integer(), nullable=True))

    # Get connection for data migration
    connection = op.get_bind()

    # Assign new integer IDs
    users = connection.execute(sa.text("SELECT id FROM users ORDER BY created_at")).fetchall()
    id_mapping = {}
    for idx, user in enumerate(users, start=1):
        id_mapping[user[0]] = idx
        connection.execute(
            sa.text("UPDATE users SET new_id = :new_id WHERE id = :old_id"),
            {"new_id": idx, "old_id": user[0]}
        )

    # Update the new_original_invitee_id based on the mapping
    for old_uuid, new_int in id_mapping.items():
        connection.execute(
            sa.text(
                "UPDATE users SET new_original_invitee_id = :new_int "
                "WHERE original_invitee_id = :old_uuid"
            ),
            {"new_int": new_int, "old_uuid": old_uuid}
        )

    # Drop the foreign key constraint first
    op.drop_constraint('users_original_invitee_id_fkey', 'users', type_='foreignkey')

    # Drop old columns and rename new ones
    op.drop_constraint('users_pkey', 'users', type_='primary')
    op.drop_column('users', 'original_invitee_id')
    op.drop_column('users', 'id')

    op.alter_column('users', 'new_id', new_column_name='id', nullable=False)
    op.alter_column('users', 'new_original_invitee_id', new_column_name='original_invitee_id')

    # Add primary key and auto-increment
    op.create_primary_key('users_pkey', 'users', ['id'])

    # Recreate foreign key
    op.create_foreign_key(
        'users_original_invitee_id_fkey',
        'users', 'users',
        ['original_invitee_id'], ['id'],
        ondelete='SET NULL'
    )

