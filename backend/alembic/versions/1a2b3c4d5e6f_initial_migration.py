"""initial migration

Revision ID: 1a2b3c4d5e6f
Revises: 
Create Date: 2026-08-25 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1a2b3c4d5e6f'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # create users table
    op.create_table(
        'users',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('hashed_password', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False),
        sa.Column('auth_provider', sa.String(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_login', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # create user_profiles table
    op.create_table(
        'user_profiles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('age_group', sa.String(), nullable=True),
        sa.Column('location', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # create skin_profiles table
    op.create_table(
        'skin_profiles',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('skin_type', sa.String(), nullable=False),
        sa.Column('allergies', sa.Text(), nullable=True),
        sa.Column('sensitivities', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )

    # create skin_concerns table
    op.create_table(
        'skin_concerns',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('code', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skin_concerns_code'), 'skin_concerns', ['code'], unique=True)

    # create user_skin_concerns table
    op.create_table(
        'user_skin_concerns',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('skin_profile_id', sa.Uuid(), nullable=False),
        sa.Column('concern_id', sa.Uuid(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['concern_id'], ['skin_concerns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['skin_profile_id'], ['skin_profiles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # create lifestyle_records table
    op.create_table(
        'lifestyle_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('physical_activity', sa.String(), nullable=True),
        sa.Column('smoking', sa.String(), nullable=True),
        sa.Column('alcohol', sa.String(), nullable=True),
        sa.Column('stress_level', sa.Integer(), nullable=True),
        sa.Column('record_date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # create sleep_records table
    op.create_table(
        'sleep_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('duration_minutes', sa.Integer(), nullable=True),
        sa.Column('quality', sa.String(), nullable=True),
        sa.Column('bedtime', sa.String(), nullable=True),
        sa.Column('wake_time', sa.String(), nullable=True),
        sa.Column('record_date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # create hydration_records table
    op.create_table(
        'hydration_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('water_intake_ml', sa.Integer(), nullable=False),
        sa.Column('target_water_ml', sa.Integer(), nullable=False),
        sa.Column('record_date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # create environmental_exposure_records table
    op.create_table(
        'environmental_exposure_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('uv_exposure', sa.String(), nullable=True),
        sa.Column('pollution_exposure', sa.String(), nullable=True),
        sa.Column('outdoor_time_minutes', sa.Integer(), nullable=False),
        sa.Column('climate', sa.String(), nullable=True),
        sa.Column('record_date', sa.Date(), server_default=sa.text('CURRENT_DATE'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    op.drop_table('environmental_exposure_records')
    op.drop_table('hydration_records')
    op.drop_table('sleep_records')
    op.drop_table('lifestyle_records')
    op.drop_table('user_skin_concerns')
    op.drop_index(op.f('ix_skin_concerns_code'), table_name='skin_concerns')
    op.drop_table('skin_concerns')
    op.drop_table('skin_profiles')
    op.drop_table('user_profiles')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')
