from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, DateTime, Date, ForeignKey, Text, Float, Boolean, JSON
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(String(50), nullable=False)
    phone = Column(String(30), nullable=True)
    bio = Column(Text, nullable=True)
    role = Column(String(30), nullable=False, default="user")  # user | skincare_consultant | dermatologist | admin
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sleep_logs = relationship("SleepLog", back_populates="user", cascade="all, delete-orphan")
    hydration_logs = relationship("HydrationLog", back_populates="user", cascade="all, delete-orphan")
    lifestyle_logs = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    assessments = relationship("SkinAssessment", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("SkincareRoutine", back_populates="user", cascade="all, delete-orphan")
    checklist_logs = relationship("RoutineChecklistLog", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    authored_reports = relationship("DermatologistReport", foreign_keys="DermatologistReport.dermatologist_id", back_populates="dermatologist")
    received_reports = relationship("DermatologistReport", foreign_keys="DermatologistReport.patient_id", back_populates="patient", cascade="all, delete-orphan")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    skin_type = Column(String(30), nullable=False)  # Normal | Dry | Oily | Combination | Sensitive
    age_group = Column(String(50), nullable=False)  # 18-25 | 26-35 | 36-45 | 46-55 | 56+
    skin_concerns = Column(Text, default="[]")      # JSON array string e.g. ["Acne", "Dark Spots"]
    allergies = Column(Text, default="[]")          # JSON array string e.g. ["Fragrance", "Nuts"]
    sensitivities = Column(Text, default="[]")      # JSON array string
    lifestyle_habits = Column(Text, default="[]")   # JSON array string
    sleep_quality = Column(String(30), nullable=False, default="Good")
    water_intake = Column(Float, nullable=False, default=2.0)
    sun_exposure = Column(String(100), default="Moderate")
    pollution_exposure = Column(String(100), default="Moderate")
    climate_type = Column(String(100), default="Temperate")
    uv_index_exposure = Column(String(50), default="Moderate")
    region = Column(String(120), default="Urban")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="profile")


class SleepLog(Base):
    __tablename__ = "sleep_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    sleep_hours = Column(Float, nullable=False)
    bedtime = Column(String(20), nullable=True)
    wakeup_time = Column(String(20), nullable=True)
    sleep_quality = Column(Integer, nullable=False, default=7)  # 1 - 10
    quality = Column(String(30), nullable=True, default="Good")
    consistency = Column(Integer, nullable=True, default=7)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="sleep_logs")


class HydrationLog(Base):
    __tablename__ = "hydration_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    water_litres = Column(Float, nullable=False, default=2.0)
    glasses_of_water = Column(Integer, nullable=False, default=8)
    glasses = Column(Integer, nullable=True, default=8)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="hydration_logs")


class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    exercise_minutes = Column(Integer, default=30)
    diet_quality = Column(Integer, default=3)  # 1 - 5
    stress_level = Column(Integer, default=3)  # 1 - 5
    smoking = Column(Boolean, default=False)
    alcohol = Column(Boolean, default=False)
    sun_exposure_hours = Column(Float, default=1.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lifestyle_logs")


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Float, nullable=False)
    condition_score = Column(Float, nullable=False)
    lifestyle_score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)
    consistency_score = Column(Float, nullable=False)
    hydration_score = Column(Float, nullable=False)
    concern_priorities = Column(Text, default="[]")  # JSON array of prioritized concerns
    risk_factors = Column(Text, default="[]")        # JSON array of risk factors
    recommendation_summary = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="assessments")


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    morning_routine = Column(Text, default="[]")  # JSON list of routine steps
    evening_routine = Column(Text, default="[]")
    weekly_routine = Column(Text, default="[]")
    seasonal_routine = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="routines")


class RoutineChecklistLog(Base):
    __tablename__ = "routine_checklist_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    completed_steps = Column(Text, default="[]")  # JSON list of step IDs completed
    total_steps = Column(Integer, default=6)
    completion_rate = Column(Float, default=0.0)  # percentage 0 - 100
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="checklist_logs")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    category = Column(String(80), nullable=False)
    description = Column(Text, default="")
    key_benefits = Column(Text, default="[]")              # JSON array
    suitable_skin_types = Column(Text, default="[]")       # JSON array
    conflicting_ingredients = Column(Text, default="[]")   # JSON array
    synergistic_ingredients = Column(Text, default="[]")   # JSON array
    allergen_warning = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    brand = Column(String(100), nullable=False)
    category = Column(String(80), nullable=False)          # Cleanser | Moisturizer | Sunscreen | Serum | Treatment
    price = Column(Float, nullable=False)
    price_tier = Column(String(30), default="Mid-Range")   # Budget | Mid-Range | Luxury
    suitable_skin_types = Column(Text, default="[]")       # JSON array
    target_concerns = Column(Text, default="[]")           # JSON array
    key_ingredients = Column(Text, default="[]")           # JSON array
    full_ingredients = Column(Text, default="")
    rating = Column(Float, default=4.5)
    image_url = Column(String(255), default="")
    created_at = Column(DateTime, default=datetime.utcnow)


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(Date, default=date.today, nullable=False)
    condition_rating = Column(Integer, nullable=False, default=7)  # 1 - 10
    skin_condition_rating = Column(Integer, nullable=True, default=7)
    active_concerns = Column(Text, default="[]")                   # JSON array of concerns present
    notes = Column(Text, default="")
    photo_url = Column(String(255), nullable=True)
    skin_health_score_at_log = Column(Float, nullable=True, default=75.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_logs")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="system")  # routine_reminder | hydration_reminder | sleep_reminder | system
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class DermatologistReport(Base):
    __tablename__ = "dermatologist_reports"

    id = Column(Integer, primary_key=True, index=True)
    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    diagnosis = Column(Text, nullable=False)
    treatment_plan = Column(Text, nullable=False)
    prescribed_ingredients = Column(Text, default="[]")  # JSON array of ingredient names
    avoid_ingredients = Column(Text, default="[]")        # JSON array of ingredient names to avoid
    follow_up_date = Column(Date, nullable=True)
    notes = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

    dermatologist = relationship("User", foreign_keys=[dermatologist_id], back_populates="authored_reports")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="received_reports")
