"""5e6f7a8b9c0d_add_adherence_and_recommendations

Revision ID: 5e6f7a8b9c0d
Revises: 4d5e6f7a8b9c
Create Date: 2026-09-10

Adds:
- routine_adherence_records: daily check-off log for routine steps and adherence scoring
- professional_recommendations: clinical prescriptions and advisory notes from dermatologists/consultants
"""
from alembic import op
import sqlalchemy as sa

revision = '5e6f7a8b9c0d'
down_revision = '4d5e6f7a8b9c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. routine_adherence_records
    op.create_table(
        'routine_adherence_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('routine_id', sa.Uuid(), nullable=False),
        sa.Column('routine_step_id', sa.Uuid(), nullable=False),
        sa.Column('record_date', sa.String(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_id'], ['routines.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['routine_step_id'], ['routine_steps.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_user_date_step', 'routine_adherence_records', ['user_id', 'record_date', 'routine_step_id'], unique=True)
    op.create_index(op.f('ix_routine_adherence_records_user_id'), 'routine_adherence_records', ['user_id'], unique=False)
    op.create_index(op.f('ix_routine_adherence_records_routine_id'), 'routine_adherence_records', ['routine_id'], unique=False)
    op.create_index(op.f('ix_routine_adherence_records_routine_step_id'), 'routine_adherence_records', ['routine_step_id'], unique=False)
    op.create_index(op.f('ix_routine_adherence_records_record_date'), 'routine_adherence_records', ['record_date'], unique=False)

    # 2. professional_recommendations
    op.create_table(
        'professional_recommendations',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('connection_id', sa.Uuid(), nullable=True),
        sa.Column('professional_id', sa.Uuid(), nullable=False),
        sa.Column('patient_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('clinical_notes', sa.Text(), nullable=False),
        sa.Column('prescribed_actives', sa.JSON(), nullable=True),
        sa.Column('recommended_products', sa.JSON(), nullable=True),
        sa.Column('contraindications', sa.JSON(), nullable=True),
        sa.Column('follow_up_weeks', sa.Integer(), nullable=True, server_default='4'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['connection_id'], ['professional_connections.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['professional_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['patient_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('idx_patient_created', 'professional_recommendations', ['patient_id', 'created_at'], unique=False)
    op.create_index('idx_prof_created', 'professional_recommendations', ['professional_id', 'created_at'], unique=False)
    op.create_index(op.f('ix_professional_recommendations_professional_id'), 'professional_recommendations', ['professional_id'], unique=False)
    op.create_index(op.f('ix_professional_recommendations_patient_id'), 'professional_recommendations', ['patient_id'], unique=False)

    # 3. routine_steps — add product_recommendations
    op.add_column('routine_steps', sa.Column('product_recommendations', sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column('routine_steps', 'product_recommendations')
    op.drop_table('professional_recommendations')
    op.drop_table('routine_adherence_records')
