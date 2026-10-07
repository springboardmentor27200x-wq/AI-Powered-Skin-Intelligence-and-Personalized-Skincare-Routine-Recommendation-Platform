from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
        nullable=False
    )

    log_date = Column(
        Date,
        index=True,
        nullable=False
    )

    sleep_hours = Column(
        Float,
        nullable=False,
        default=0.0
    )

    sleep_quality = Column(
        String(50),
        nullable=False
    )

    water_intake_ml = Column(
        Integer,
        nullable=False,
        default=0
    )

    uv_exposure = Column(
        String(50),
        nullable=True
    )

    pollution_exposure = Column(
        String(50),
        nullable=True
    )

    stress_level = Column(
        String(50),
        nullable=True
    )

    sunscreen_applied = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    user = relationship("User", back_populates="lifestyle_logs")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "log_date",
            name="uq_user_log_date"
        ),
    )
