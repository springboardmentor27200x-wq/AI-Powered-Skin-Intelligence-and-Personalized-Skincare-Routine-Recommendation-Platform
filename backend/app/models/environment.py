import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class EnvironmentalExposureRecord(Base):
    __tablename__ = "environmental_exposure_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    uv_exposure = Column(String, nullable=True)  # LOW, MODERATE, HIGH
    pollution_exposure = Column(String, nullable=True)  # LOW, MODERATE, HIGH
    outdoor_time_minutes = Column(Integer, default=0, nullable=False)
    climate = Column(String, nullable=True)  # DRY, HUMID, TEMPERATE, COLD, HOT
    record_date = Column(Date, default=func.current_date(), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="environmental_exposure_records")
