from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    date_logged = Column(DateTime(timezone=True), server_default=func.now())
    
    # 0 to 100 overall skin health score
    skin_health_score = Column(Float)
    
    # Text notes from the user
    notes = Column(Text, nullable=True)
    
    # Adherence to routine (percentage 0-100)
    routine_adherence = Column(Integer, default=100)
    
    # Water intake, sleep hours could be optionally logged again, or we just rely on score
    
    # Relationship to user
    user = relationship("User", backref="progress_logs")
