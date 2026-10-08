"""4d5e6f7a8b9c_add_ml_fields_to_assessment_tables

Revision ID: 4d5e6f7a8b9c
Revises: 3c4d5e6f7a8b
Create Date: 2026-09-03

Adds AI/ML columns to assessment tables:
- skin_assessments: assessment_mode, ai_model_version, ai_concern_predictions, ai_risk_predictions
- assessment_concerns: ml_probability, assessment_mode
- risk_factors: ml_probability, assessment_mode
"""
from alembic import op
import sqlalchemy as sa

revision = '4d5e6f7a8b9c'
down_revision = '3c4d5e6f7a8b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # skin_assessments — AI/ML metadata columns
    op.add_column('skin_assessments', sa.Column('assessment_mode', sa.String(30), nullable=True, server_default='AI_ASSISTED'))
    op.add_column('skin_assessments', sa.Column('ai_model_version', sa.String(20), nullable=True))
    op.add_column('skin_assessments', sa.Column('ai_concern_predictions', sa.JSON(), nullable=True))
    op.add_column('skin_assessments', sa.Column('ai_risk_predictions', sa.JSON(), nullable=True))

    # assessment_concerns — ML probability
    op.add_column('assessment_concerns', sa.Column('ml_probability', sa.Float(), nullable=True))
    op.add_column('assessment_concerns', sa.Column('assessment_mode', sa.String(30), nullable=True))

    # risk_factors — ML probability
    op.add_column('risk_factors', sa.Column('ml_probability', sa.Float(), nullable=True))
    op.add_column('risk_factors', sa.Column('assessment_mode', sa.String(30), nullable=True))


def downgrade() -> None:
    op.drop_column('risk_factors', 'assessment_mode')
    op.drop_column('risk_factors', 'ml_probability')
    op.drop_column('assessment_concerns', 'assessment_mode')
    op.drop_column('assessment_concerns', 'ml_probability')
    op.drop_column('skin_assessments', 'ai_risk_predictions')
    op.drop_column('skin_assessments', 'ai_concern_predictions')
    op.drop_column('skin_assessments', 'ai_model_version')
    op.drop_column('skin_assessments', 'assessment_mode')
