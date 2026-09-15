"""simplify_models_single_business

Revision ID: 9305d91b3d78
Revises: 0e631bd23bbc
Create Date: 2026-09-15 13:34:41.535605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '9305d91b3d78'
down_revision: Union[str, None] = '0e631bd23bbc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema to single-business architecture."""
    # 1. Drop court_blocks table
    op.drop_index(op.f('ix_court_blocks_court_id'), table_name='court_blocks')
    op.drop_index(op.f('ix_court_blocks_end_datetime'), table_name='court_blocks')
    op.drop_index(op.f('ix_court_blocks_id'), table_name='court_blocks')
    op.drop_index(op.f('ix_court_blocks_start_datetime'), table_name='court_blocks')
    op.drop_table('court_blocks')

    # 2. Drop business_members table
    op.drop_index(op.f('ix_business_members_business_id'), table_name='business_members')
    op.drop_index(op.f('ix_business_members_id'), table_name='business_members')
    op.drop_index(op.f('ix_business_members_user_id'), table_name='business_members')
    op.drop_table('business_members')

    # 3. Remove foreign key and business_id column from venues BEFORE dropping businesses
    op.drop_constraint('venues_business_id_fkey', 'venues', type_='foreignkey')
    op.drop_index(op.f('ix_venues_business_id'), table_name='venues')
    op.drop_constraint('uq_venue_business_slug', 'venues', type_='unique')
    op.drop_column('venues', 'business_id')

    # Update venue slug to be globally unique
    op.drop_index(op.f('ix_venues_slug'), table_name='venues')
    op.create_index(op.f('ix_venues_slug'), 'venues', ['slug'], unique=True)

    # 4. Now safe to drop businesses table
    op.drop_index(op.f('ix_businesses_id'), table_name='businesses')
    op.drop_index(op.f('ix_businesses_slug'), table_name='businesses')
    op.drop_table('businesses')

    # 5. Add base_price_per_hour to courts
    op.add_column(
        'courts',
        sa.Column('base_price_per_hour', sa.Numeric(precision=10, scale=2), server_default='1000.00', nullable=False)
    )

    # 6. Create userrole enum and add role column to users
    user_role_enum = postgresql.ENUM('ADMIN', 'STAFF', 'CUSTOMER', name='userrole')
    user_role_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        'users',
        sa.Column('role', user_role_enum, server_default='CUSTOMER', nullable=False)
    )
    op.create_index(op.f('ix_users_role'), 'users', ['role'], unique=False)

    # 7. Add BLOCKED value to bookingstatus enum if not present
    op.execute("ALTER TYPE bookingstatus ADD VALUE IF NOT EXISTS 'BLOCKED'")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_users_role'), table_name='users')
    op.drop_column('users', 'role')
    op.drop_column('courts', 'base_price_per_hour')

    # Recreate businesses
    op.create_table(
        'businesses',
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.VARCHAR(), nullable=False),
        sa.Column('slug', sa.VARCHAR(), nullable=False),
        sa.Column('email', sa.VARCHAR(), nullable=True),
        sa.Column('phone_number', sa.VARCHAR(), nullable=True),
        sa.Column('description', sa.VARCHAR(), nullable=True),
        sa.Column('logo_url', sa.VARCHAR(), nullable=True),
        sa.Column('is_active', sa.BOOLEAN(), nullable=False),
        sa.PrimaryKeyConstraint('id', name=op.f('businesses_pkey'))
    )
    op.create_index(op.f('ix_businesses_slug'), 'businesses', ['slug'], unique=True)
    op.create_index(op.f('ix_businesses_id'), 'businesses', ['id'], unique=False)

    # Re-add business_id to venues
    op.add_column('venues', sa.Column('business_id', sa.UUID(), nullable=False))
    op.create_foreign_key('venues_business_id_fkey', 'venues', 'businesses', ['business_id'], ['id'], ondelete='CASCADE')
    op.drop_index(op.f('ix_venues_slug'), table_name='venues')
    op.create_index(op.f('ix_venues_slug'), 'venues', ['slug'], unique=False)
    op.create_unique_constraint('uq_venue_business_slug', 'venues', ['business_id', 'slug'])
    op.create_index(op.f('ix_venues_business_id'), 'venues', ['business_id'], unique=False)

    # Recreate business_members
    op.create_table(
        'business_members',
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('business_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('role', postgresql.ENUM('OWNER', 'MANAGER', 'STAFF', name='businessrole'), nullable=False),
        sa.Column('is_active', sa.BOOLEAN(), nullable=False),
        sa.ForeignKeyConstraint(['business_id'], ['businesses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('business_members_pkey')),
        sa.UniqueConstraint('business_id', 'user_id', name=op.f('uq_business_member'))
    )

    # Recreate court_blocks
    op.create_table(
        'court_blocks',
        sa.Column('created_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('updated_at', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('court_id', sa.UUID(), nullable=False),
        sa.Column('start_datetime', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('end_datetime', postgresql.TIMESTAMP(timezone=True), nullable=False),
        sa.Column('reason', sa.VARCHAR(), nullable=False),
        sa.Column('created_by_user_id', sa.UUID(), nullable=True),
        sa.ForeignKeyConstraint(['court_id'], ['courts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('court_blocks_pkey'))
    )
