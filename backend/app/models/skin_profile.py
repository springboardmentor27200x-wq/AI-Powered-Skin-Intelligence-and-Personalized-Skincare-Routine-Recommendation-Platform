import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SkinProfile(Base):
    """A user's static skin profile — skin type, age group, allergies,
    and sensitivities. Sleep/hydration/lifestyle/environment are tracked
    daily instead (see sleep_record.py, lifestyle_record.py, etc.) since
    those change day to day and the scoring engine reads from there."""

    __tablename__ = "skin_profiles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    skin_type: Mapped[str] = mapped_column(String(30), nullable=False)
    age_group: Mapped[str] = mapped_column(String(20), nullable=False)
    allergies: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    sensitivities: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )