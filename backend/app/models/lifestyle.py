from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class LifestyleProfile(Base):
    __tablename__ = "lifestyle_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    physical_activity = Column(String(50), nullable=False)
    smoking = Column(String(50), nullable=False)
    alcohol_consumption = Column(String(50), nullable=False)
    screen_time_hours = Column(Float, nullable=False, default=0.0)
    outdoor_exposure = Column(String(100), nullable=False)
    pollution_exposure = Column(String(50), nullable=True)
    sun_exposure = Column(String(50), nullable=True)
    environment_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="lifestyle_profile")

    def __repr__(self):
        return f"<LifestyleProfile id={self.id} user_id={self.user_id}>"
