import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="SET NULL"), nullable=True, index=True)
    routine_type = Column(String, nullable=False)  # MORNING, EVENING, WEEKLY, SEASONAL
    version = Column(Integer, default=1, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    summary = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="routines")
    assessment = relationship("SkinAssessment", back_populates="routines")
    steps = relationship("RoutineStep", back_populates="routine", cascade="all, delete-orphan", order_by="RoutineStep.step_order")


class RoutineStep(Base):
    __tablename__ = "routine_steps"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    routine_id = Column(Uuid, ForeignKey("routines.id", ondelete="CASCADE"), nullable=False, index=True)
    step_order = Column(Integer, nullable=False)  # 1, 2, 3...
    category = Column(String, nullable=False)  # CLEANSING, EXFOLIATION, TREATMENT, MOISTURIZING, SUN_PROTECTION, NIGHT_CARE
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    frequency = Column(String, default="DAILY", nullable=False)  # DAILY, 2X_WEEKLY, AS_NEEDED
    key_actives = Column(JSON, nullable=True)  # List[str] of recommended active ingredients
    safety_notes = Column(Text, nullable=True)
    product_recommendations = Column(JSON, nullable=True)  # List[Dict[str, Any]] curated clinical matches

    # Relationships
    routine = relationship("Routine", back_populates="steps")
