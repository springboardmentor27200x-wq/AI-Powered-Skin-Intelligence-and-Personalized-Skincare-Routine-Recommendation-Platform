"""7a8b9c0d1e2f_milestone_4_notifications_and_reports

Revision ID: 7a8b9c0d1e2f
Revises: 6f7a8b9c0d1e
Create Date: 2026-10-04

Adds:
- notifications: User notifications and reminders
- notification_preferences: User notification configuration and reminder toggles
- report_records: Audit trail for generated PDF and Excel clinical reports
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '7a8b9c0d1e2f'
down_revision = '6f7a8b9c0d1e'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. notifications ──────────────────────────────────────────────────────
    op.create_table(
        'notifications',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('category', postgresql.ENUM('ROUTINE', 'REPLENISHMENT', 'HYDRATION', 'SLEEP', 'PROGRESS', 'PLATFORM', name='notificationcategory', create_type=False), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('message', sa.String(1000), nullable=False),
        sa.Column('priority', postgresql.ENUM('LOW', 'MEDIUM', 'HIGH', name='notificationpriority', create_type=False), nullable=False),
        sa.Column('is_read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('action_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])

    # ── 2. notification_preferences ───────────────────────────────────────────
    op.create_table(
        'notification_preferences',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('routine_reminders', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('hydration_reminders', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('sleep_reminders', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('product_replenishment', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('progress_alerts', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('platform_announcements', sa.Boolean(), nullable=True, server_default='true'),
        sa.Column('morning_time', sa.String(5), nullable=True, server_default='07:00'),
        sa.Column('evening_time', sa.String(5), nullable=True, server_default='21:00'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_notification_preferences_user_id', 'notification_preferences', ['user_id'], unique=True)

    # ── 3. report_records ─────────────────────────────────────────────────────
    op.create_table(
        'report_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('generated_by_id', sa.Uuid(), nullable=True),
        sa.Column('report_type', postgresql.ENUM('SKIN_ASSESSMENT', 'PERSONALIZED_ROUTINE', 'PRODUCT_RECOMMENDATION', 'PROGRESS_LONGITUDINAL', 'COMPREHENSIVE_5PILLAR', name='reporttype', create_type=False), nullable=False),
        sa.Column('export_format', postgresql.ENUM('PDF', 'EXCEL', 'JSON', name='exportformat', create_type=False), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['generated_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_report_records_user_id', 'report_records', ['user_id'])


def downgrade() -> None:
    op.drop_table('report_records')
    op.drop_table('notification_preferences')
    op.drop_table('notifications')
