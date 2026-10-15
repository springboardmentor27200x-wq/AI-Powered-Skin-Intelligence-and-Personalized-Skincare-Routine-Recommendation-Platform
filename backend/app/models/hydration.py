from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class HydrationRecord(Base):
    __tablename__ = "hydration_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    water_intake_ml = Column(Float, nullable=False)
    record_date = Column(Date, default=date.today, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="hydration_records")

    def __repr__(self):
        return f"<HydrationRecord id={self.id} user_id={self.user_id} ml={self.water_intake_ml} date={self.record_date}>"
