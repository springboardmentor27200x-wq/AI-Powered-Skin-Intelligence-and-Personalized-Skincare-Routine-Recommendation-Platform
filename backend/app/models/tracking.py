import enum
from datetime import datetime, date, timezone
from sqlalchemy import Column, Integer, Float, String, Text, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base

class SleepQualityEnum(str, enum.Enum):
    POOR = "POOR"
    FAIR = "FAIR"
    GOOD = "GOOD"
    EXCELLENT = "EXCELLENT"

class WakeFeelingEnum(str, enum.Enum):
    GOOD_REFRESHED = "Good & Refreshed"
    MODERATE = "Moderate"
    TIRED_FATIGUED = "Tired & Fatigued"
    EXHAUSTED = "Exhausted"

class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, default=date.today, nullable=False, index=True)
    
    working_routine = Column(String(100), default="Desk/Screen work indoors", nullable=False)
    exercise_frequency = Column(String(100), default="3-4 times a week", nullable=False)
    exercise_minutes = Column(Integer, default=30, nullable=False)
    stress_level = Column(Integer, default=5, nullable=False)
    diet_quality_score = Column(Integer, default=7, nullable=False)
    alcohol_units = Column(Integer, default=0, nullable=False)
    smoking_status = Column(String(50), default="Non-smoker", nullable=False)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="lifestyle_logs")

class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, default=date.today, nullable=False, index=True)

    sleep_duration_hours = Column(Float, default=7.5, nullable=False)
    sleep_quality = Column(Enum(SleepQualityEnum), default=SleepQualityEnum.GOOD, nullable=False)
    wake_feeling = Column(String(50), default="Good & Refreshed", nullable=False)
    deep_sleep_hours = Column(Float, default=2.0, nullable=True)
    bedtime = Column(String(10), default="23:00", nullable=True)
    wake_time = Column(String(10), default="07:00", nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="sleep_logs")

class HydrationLog(Base):
    __tablename__ = "hydration_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, default=date.today, nullable=False, index=True)

    water_amount_ml = Column(Integer, default=250, nullable=False)
    target_ml = Column(Integer, default=2500, nullable=False)
    glasses_count = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="hydration_logs")

class EnvironmentLog(Base):
    __tablename__ = "environment_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    log_date = Column(Date, default=date.today, nullable=False, index=True)

    sun_exposure_hours = Column(Float, default=2.0, nullable=False)
    uv_index = Column(Float, default=4.0, nullable=False)
    dust_pollution_exposure = Column(String(50), default="Moderate", nullable=False)
    weather_condition = Column(String(100), default="Cold & Dry", nullable=False)
    pollution_aqi = Column(Integer, default=45, nullable=False)
    humidity_percent = Column(Float, default=55.0, nullable=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("User", back_populates="environment_logs")
