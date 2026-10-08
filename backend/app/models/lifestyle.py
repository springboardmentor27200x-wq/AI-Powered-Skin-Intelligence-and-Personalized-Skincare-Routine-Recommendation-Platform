import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class LifestyleRecord(Base):
    __tablename__ = "lifestyle_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    physical_activity = Column(String, nullable=True)  # SEDENTARY, MODERATE, ACTIVE
    smoking = Column(String, nullable=True)  # NONE, LIGHT, HEAVY
    alcohol = Column(String, nullable=True)  # NONE, LIGHT, HEAVY
    stress_level = Column(Integer, nullable=True)  # 1 to 10
    record_date = Column(Date, default=func.current_date(), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="lifestyle_records")
