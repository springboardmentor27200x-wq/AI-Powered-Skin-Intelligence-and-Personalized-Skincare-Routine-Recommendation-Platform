"""8b9c0d1e2f3a_care_circle_referrals_and_chat_messages

Revision ID: 8b9c0d1e2f3a
Revises: 7a8b9c0d1e2f
Create Date: 2026-10-04

Adds:
- professional_connections: referral provenance fields (referred_by_id, referral_notes, referral_priority)
- chat_messages: WhatsApp-style two-way real-time Care Circle messaging table
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '8b9c0d1e2f3a'
down_revision = '7a8b9c0d1e2f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Update professional_connections with referral provenance ──────────
    with op.batch_alter_table('professional_connections') as batch_op:
        batch_op.add_column(sa.Column('referred_by_id', sa.Uuid(), nullable=True))
        batch_op.add_column(sa.Column('referral_notes', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('referral_priority', sa.String(), server_default='ROUTINE', nullable=True))
        batch_op.create_foreign_key(
            'fk_prof_connections_referred_by',
            'users',
            ['referred_by_id'],
            ['id'],
            ondelete='SET NULL'
        )
        batch_op.create_index('ix_prof_connections_referred_by', ['referred_by_id'])

    # ── 2. Create chat_messages table ─────────────────────────────────────────
    op.create_table(
        'chat_messages',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('sender_id', sa.Uuid(), nullable=False),
        sa.Column('recipient_id', sa.Uuid(), nullable=False),
        sa.Column('connection_id', sa.Uuid(), nullable=True),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('message_type', sa.String(), server_default='TEXT', nullable=False),
        sa.Column('meta_data', sa.JSON(), nullable=True),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['connection_id'], ['professional_connections.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_chat_messages_sender_id', 'chat_messages', ['sender_id'])
    op.create_index('ix_chat_messages_recipient_id', 'chat_messages', ['recipient_id'])
    op.create_index('ix_chat_messages_connection_id', 'chat_messages', ['connection_id'])
    op.create_index('ix_chat_messages_created_at', 'chat_messages', ['created_at'])
    op.create_index('idx_chat_thread', 'chat_messages', ['sender_id', 'recipient_id', 'created_at'])
    op.create_index('idx_chat_recipient_unread', 'chat_messages', ['recipient_id', 'is_read'])


def downgrade() -> None:
    op.drop_table('chat_messages')
    with op.batch_alter_table('professional_connections') as batch_op:
        batch_op.drop_index('ix_prof_connections_referred_by')
        batch_op.drop_constraint('fk_prof_connections_referred_by', type_='foreignkey')
        batch_op.drop_column('referral_priority')
        batch_op.drop_column('referral_notes')
        batch_op.drop_column('referred_by_id')
