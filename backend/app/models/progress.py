import uuid
from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class ProgressSnapshot(Base):
    """
    A point-in-time snapshot of a user's skin health scores, captured
    each time an assessment is completed. Used for progress tracking,
    trend charts, improvement analysis, and before/after comparisons.

    Only stores real completed assessment values — no fabricated data.
    """
    __tablename__ = "progress_snapshots"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)

    snapshot_date = Column(String(20), nullable=False, index=True)   # YYYY-MM-DD for easy grouping
    overall_score = Column(Integer, nullable=False)
    skin_condition_score = Column(Integer, nullable=True)
    lifestyle_score = Column(Integer, nullable=True)
    sleep_score = Column(Integer, nullable=True)
    routine_consistency_score = Column(Integer, nullable=True)
    hydration_score = Column(Integer, nullable=True)
    concern_values = Column(JSON, nullable=True)  # {"ACNE": 70, "DRYNESS": 45, ...}

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")
    assessment = relationship("SkinAssessment")
