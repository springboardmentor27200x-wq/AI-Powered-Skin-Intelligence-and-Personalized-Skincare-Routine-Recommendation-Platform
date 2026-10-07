from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class SkinAssessment(Base):
    """Stores a snapshot of a user's skin assessment results."""

    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Overall composite skin health score (0–100)
    overall_score = Column(Float, nullable=False)

    # JSON breakdown: {factor: {score, weight, weighted_contribution}}
    score_breakdown = Column(JSON, nullable=False, default=dict)

    # JSON list: [{concern, severity, score, modifiers, explanation}]
    concern_analysis = Column(JSON, nullable=False, default=list)

    # JSON list: [{risk, description, recommended_action}]
    risk_factors = Column(JSON, nullable=False, default=list)

    # JSON: {avg_sleep, avg_water, sunscreen_rate, uv_exposure, stress_level}
    lifestyle_snapshot = Column(JSON, nullable=True, default=dict)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User", back_populates="skin_assessments")
