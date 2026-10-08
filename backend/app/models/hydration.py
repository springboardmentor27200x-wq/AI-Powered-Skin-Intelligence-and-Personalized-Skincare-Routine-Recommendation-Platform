import uuid
from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class HydrationRecord(Base):
    __tablename__ = "hydration_records"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    water_intake_ml = Column(Integer, default=0, nullable=False)
    target_water_ml = Column(Integer, default=2000, nullable=False)
    record_date = Column(Date, default=func.current_date(), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="hydration_records")
