import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class RoutineAdherenceRecord(Base):
    __tablename__ = "routine_adherence_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    routine_id = Column(Uuid, ForeignKey("routines.id", ondelete="CASCADE"), nullable=False, index=True)
    routine_step_id = Column(Uuid, ForeignKey("routine_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    record_date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    completed = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="routine_adherence_records")
    routine = relationship("Routine")
    step = relationship("RoutineStep")

    __table_args__ = (
        Index("idx_user_date_step", "user_id", "record_date", "routine_step_id", unique=True),
    )
