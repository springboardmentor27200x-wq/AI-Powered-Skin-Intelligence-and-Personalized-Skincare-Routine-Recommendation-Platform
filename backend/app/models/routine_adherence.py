import uuid
from datetime import date as date_type, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class RoutineAdherenceLog(Base):
    """Did the user actually do their morning/evening routine today?
    Feeds the "Routine Consistency" 20% of the skin health score."""

    __tablename__ = "routine_adherence_logs"
    __table_args__ = (UniqueConstraint("user_id", "log_date", name="uq_adherence_user_date"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    log_date: Mapped[date_type] = mapped_column(Date, nullable=False)
    morning_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    evening_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )