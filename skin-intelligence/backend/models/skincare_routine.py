from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class SkincareRoutine(Base):
    """Stores a generated personalized skincare routine for a user."""

    __tablename__ = "skincare_routines"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # JSON list of step dicts for the morning routine
    morning_routine = Column(JSON, nullable=False, default=list)

    # JSON list of step dicts for the evening routine
    evening_routine = Column(JSON, nullable=False, default=list)

    # JSON list of weekly treatment dicts
    weekly_treatments = Column(JSON, nullable=False, default=list)

    # JSON list of seasonal skincare tips
    seasonal_tips = Column(JSON, nullable=False, default=list)

    # Profile snapshot used at generation time
    generated_for_skin_type = Column(String(50), nullable=False)
    generated_for_concerns = Column(JSON, nullable=False, default=list)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User", back_populates="skincare_routines")
