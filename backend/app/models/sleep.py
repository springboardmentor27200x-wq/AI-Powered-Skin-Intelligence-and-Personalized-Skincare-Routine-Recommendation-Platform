import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    quality = Column(String, nullable=True)  # POOR, FAIR, GOOD, EXCELLENT
    bedtime = Column(String, nullable=True)  # HH:MM format
    wake_time = Column(String, nullable=True)  # HH:MM format
    record_date = Column(Date, default=func.current_date(), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="sleep_records")
