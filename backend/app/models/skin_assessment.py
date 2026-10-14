import uuid
from datetime import datetime

from sqlalchemy import ARRAY, DateTime, ForeignKey, SmallInteger, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    score: Mapped[int] = mapped_column(SmallInteger, nullable=False)

    # Weighted-model breakdown — matches the project plan's 5-component formula
    skin_condition_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    lifestyle_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    sleep_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    routine_consistency_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    hydration_score: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)

    prioritized_concerns: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    risk_factors: Mapped[list[str]] = mapped_column(ARRAY(String), default=list, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())