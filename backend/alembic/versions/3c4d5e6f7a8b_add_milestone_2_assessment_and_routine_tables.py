"""add milestone 2 assessment and routine tables

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-09-02 19:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '3c4d5e6f7a8b'
down_revision = '2b3c4d5e6f7a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. skin_assessments
    op.create_table(
        'skin_assessments',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('assessment_date', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(), server_default='COMPLETED', nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skin_assessments_user_id'), 'skin_assessments', ['user_id'], unique=False)

    # 2. assessment_concerns
    op.create_table(
        'assessment_concerns',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=False),
        sa.Column('concern_name', sa.String(), nullable=False),
        sa.Column('priority', sa.String(), nullable=False),
        sa.Column('severity', sa.Integer(), nullable=False),
        sa.Column('confidence', sa.Float(), server_default='0.9', nullable=False),
        sa.Column('reasons', sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_assessment_concerns_assessment_id'), 'assessment_concerns', ['assessment_id'], unique=False)

    # 3. risk_factors
    op.create_table(
        'risk_factors',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=False),
        sa.Column('factor_type', sa.String(), nullable=False),
        sa.Column('factor_name', sa.String(), nullable=False),
        sa.Column('impact_level', sa.String(), nullable=False),
        sa.Column('impact_score', sa.Integer(), server_default='0', nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_risk_factors_assessment_id'), 'risk_factors', ['assessment_id'], unique=False)

    # 4. skin_scores
    op.create_table(
        'skin_scores',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=False),
        sa.Column('skin_condition_score', sa.Integer(), nullable=False),
        sa.Column('lifestyle_score', sa.Integer(), nullable=False),
        sa.Column('sleep_score', sa.Integer(), nullable=False),
        sa.Column('routine_consistency_score', sa.Integer(), server_default='50', nullable=False),
        sa.Column('hydration_score', sa.Integer(), nullable=False),
        sa.Column('overall_score', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('assessment_id')
    )

    # 5. routines
    op.create_table(
        'routines',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=False),
        sa.Column('assessment_id', sa.Uuid(), nullable=True),
        sa.Column('routine_type', sa.String(), nullable=False),
        sa.Column('version', sa.Integer(), server_default='1', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['assessment_id'], ['skin_assessments.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routines_user_id'), 'routines', ['user_id'], unique=False)
    op.create_index(op.f('ix_routines_assessment_id'), 'routines', ['assessment_id'], unique=False)

    # 6. routine_steps
    op.create_table(
        'routine_steps',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('routine_id', sa.Uuid(), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('frequency', sa.String(), server_default='DAILY', nullable=False),
        sa.Column('key_actives', sa.JSON(), nullable=True),
        sa.Column('safety_notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['routine_id'], ['routines.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_routine_steps_routine_id'), 'routine_steps', ['routine_id'], unique=False)


def downgrade() -> None:
    op.drop_table('routine_steps')
    op.drop_table('routines')
    op.drop_table('skin_scores')
    op.drop_table('risk_factors')
    op.drop_table('assessment_concerns')
    op.drop_table('skin_assessments')
