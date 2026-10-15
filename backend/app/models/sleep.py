from datetime import datetime, timezone, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SleepRecord(Base):
    __tablename__ = "sleep_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    sleep_duration_hours = Column(Float, nullable=False)
    sleep_quality = Column(String(50), nullable=False)
    bedtime = Column(String(20), nullable=True)
    wake_time = Column(String(20), nullable=True)
    sleep_consistency = Column(String(50), nullable=True)
    record_date = Column(Date, default=date.today, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="sleep_records")

    def __repr__(self):
        return f"<SleepRecord id={self.id} user_id={self.user_id} hours={self.sleep_duration_hours} date={self.record_date}>"
