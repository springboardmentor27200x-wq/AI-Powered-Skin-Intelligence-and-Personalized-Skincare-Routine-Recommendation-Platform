from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint

from app.core.database import Base


class RoutinePlan(Base):
    __tablename__ = "routine_plans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    routine = Column(JSON, nullable=False)
    assessment_score = Column(Integer, nullable=False)
    summary = Column(String, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class RoutineStepCompletion(Base):
    __tablename__ = "routine_step_completions"
    __table_args__ = (
        UniqueConstraint("routine_id", "record_date", "step_key", name="uq_routine_step_completion"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    routine_id = Column(Integer, ForeignKey("routine_plans.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(Date, default=date.today, nullable=False, index=True)
    step_key = Column(String, nullable=False)
    completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)