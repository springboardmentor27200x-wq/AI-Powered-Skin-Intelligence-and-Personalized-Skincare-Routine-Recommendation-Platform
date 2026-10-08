"""add professional connections table

Revision ID: 2b3c4d5e6f7a
Revises: 1a2b3c4d5e6f
Create Date: 2026-08-26 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2b3c4d5e6f7a'
down_revision = '1a2b3c4d5e6f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'professional_connections',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('professional_id', sa.Uuid(), nullable=False),
        sa.Column('professional_type', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='PENDING'),
        sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['professional_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_professional_connections_user_id'), 'professional_connections', ['user_id'], unique=False)
    op.create_index(op.f('ix_professional_connections_professional_id'), 'professional_connections', ['professional_id'], unique=False)
    op.create_index('idx_user_professional', 'professional_connections', ['user_id', 'professional_id'], unique=False)
    op.create_index('idx_prof_status', 'professional_connections', ['professional_id', 'status'], unique=False)


def downgrade() -> None:
    op.drop_index('idx_prof_status', table_name='professional_connections')
    op.drop_index('idx_user_professional', table_name='professional_connections')
    op.drop_index(op.f('ix_professional_connections_professional_id'), table_name='professional_connections')
    op.drop_index(op.f('ix_professional_connections_user_id'), table_name='professional_connections')
    op.drop_table('professional_connections')
