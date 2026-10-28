
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    email_verified = Column(Boolean, default=False, nullable=False)
    auth_provider = Column(String, default="email", nullable=False)
    google_id = Column(String, unique=True, nullable=True)

    # Roles: user, dermatologist, consultant, administrator
    role = Column(String, default="user", nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmailVerificationToken(Base):
    __tablename__ = "email_verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)

    skin_type = Column(String, nullable=True)
    concerns = Column(String, nullable=True)
    age_group = Column(String, nullable=True)
    allergies = Column(String, nullable=True)
    exercise = Column(String, nullable=True)
    stress = Column(String, nullable=True)
    sun_exposure = Column(String, nullable=True)
    pollution_exposure = Column(String, nullable=True)
    environment = Column(String, nullable=True)
    sleep = Column(String, nullable=True)
    water_intake = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )


class SkinHealthScore(Base):
    __tablename__ = "skin_health_scores"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    skin_condition_score = Column(Integer, nullable=False)
    lifestyle_score = Column(Integer, nullable=False)
    sleep_score = Column(Integer, nullable=False)
    routine_consistency_score = Column(Integer, nullable=False)
    hydration_score = Column(Integer, nullable=False)
    overall_score = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProgressEntry(Base):
    __tablename__ = "progress_entries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    skin_score = Column(Integer, nullable=False)
    routine_adherence = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DermatologistConsultation(Base):
    __tablename__ = "dermatologist_consultations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False, index=True)
    dermatologist_id = Column(Integer, nullable=True, index=True)

    status = Column(String, default="requested", nullable=False)

    # Snapshot of the user's assessment
    skin_type = Column(String, nullable=True)
    concerns = Column(Text, nullable=True)
    age_group = Column(String, nullable=True)
    allergies = Column(Text, nullable=True)
    exercise = Column(String, nullable=True)
    stress = Column(String, nullable=True)
    sun_exposure = Column(String, nullable=True)
    pollution_exposure = Column(String, nullable=True)
    environment = Column(String, nullable=True)
    sleep = Column(String, nullable=True)
    water_intake = Column(String, nullable=True)

    # Dermatologist's manually written response
    recommendations = Column(Text, nullable=True)
    ingredient_guidance = Column(Text, nullable=True)
    morning_routine = Column(Text, nullable=True)
    night_routine = Column(Text, nullable=True)
    precautions = Column(Text, nullable=True)
    follow_up_notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
