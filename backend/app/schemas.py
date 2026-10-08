from datetime import date
from typing import Literal
from pydantic import BaseModel, EmailStr, Field

from .roles import Role


# =========================
# Authentication Schemas
# =========================

# Admin is deliberately excluded because admin accounts
# should not be created through normal registration.
RegisterableRole = Literal["user", "consultant", "dermatologist"]


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RegisterableRole = Role.USER


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# =========================
# Skin Profile Schemas
# =========================

class SkinProfileCreate(BaseModel):
    user_id: int
    skin_type: str
    concerns: str
    sensitivity: str
    allergies: str
    budget_inr: float | None = Field(default=None, ge=0)


class SkinProfileResponse(SkinProfileCreate):
    id: int

    class Config:
        from_attributes = True


# =========================
# Lifestyle Schemas
# =========================

class LifestyleCreate(BaseModel):
    user_id: int

    # Daily water intake: 0–10 liters
    water_intake: float = Field(
        ge=0,
        le=10
    )

    # Exercise duration: 0–1440 minutes per day
    exercise_minutes: int = Field(
        ge=0,
        le=1440
    )

    # Stress level: 1–10
    stress_level: int = Field(
        ge=1,
        le=10
    )


class LifestyleResponse(LifestyleCreate):
    id: int

    class Config:
        from_attributes = True


# =========================
# Sleep Schemas
# =========================

class SleepCreate(BaseModel):
    user_id: int

    # Sleep duration: 0–16 hours
    sleep_hours: float = Field(
        ge=0,
        le=16
    )

    # Sleep quality: 1–10
    sleep_quality: int = Field(
        ge=1,
        le=10
    )

    date: date


class SleepResponse(BaseModel):
    id: int
    user_id: int
    sleep_hours: float
    sleep_quality: int
    date: date

    class Config:
        from_attributes = True


# =========================
# Consultation Schemas
# =========================

class ConsultationCreate(BaseModel):
    consultant_id: int
    client_id: int
    notes: str
    recommendations: str


class ConsultationResponse(BaseModel):
    id: int
    consultant_id: int
    client_id: int
    notes: str
    recommendations: str
    created_at: str

    class Config:
        from_attributes = True


# ==========================================================
# MILESTONE 2 — SKIN ASSESSMENT SCHEMAS
# ==========================================================

class SkinAssessmentCreate(BaseModel):
    user_id: int


class SkinAssessmentResponse(BaseModel):
    id: int
    user_id: int

    # Component scores
    skin_condition_score: float
    lifestyle_score: float
    sleep_score: float
    routine_consistency_score: float
    hydration_score: float

    # Overall score
    skin_score: float
    health_status: str

    # Concern analysis
    concerns: str
    primary_concern: str | None = None
    secondary_concerns: str | None = None
    risk_factors: str | None = None
    assessment_summary: str | None = None

    created_at: str

    class Config:
        from_attributes = True


# ==========================================================
# MILESTONE 2 — PERSONALIZED ROUTINE SCHEMAS
# ==========================================================

class SkincareRoutineCreate(BaseModel):
    user_id: int
    skin_type: str | None = None
    primary_concern: str | None = None
    season: str | None = None

    # Morning skincare routine
    morning_routine: str

    # Evening skincare routine
    evening_routine: str

    # Weekly treatment plan
    weekly_treatment: str

    # Recommendations based on season
    seasonal_recommendations: str

    # Changes suggested based on future assessments
    adaptive_updates: str | None = None


class SkincareRoutineResponse(BaseModel):
    id: int
    user_id: int
    skin_type: str | None = None
    primary_concern: str | None = None
    season: str | None = None

    morning_routine: str
    evening_routine: str
    weekly_treatment: str
    seasonal_recommendations: str
    adaptive_updates: str | None = None

    created_at: str

    class Config:
        from_attributes = True

# ==========================================================
# CONSULTATION REQUEST SCHEMAS
# ==========================================================

class ConsultationRequestCreate(BaseModel):
    
    professional_role: Literal["consultant", "dermatologist"]
    request_message: str | None = None


class ConsultationRequestResponse(BaseModel):
    id: int
    client_id: int
    professional_id: int
    professional_role: str
    request_message: str | None = None
    status: str
    created_at: str
    responded_at: str | None = None

    class Config:
        from_attributes = True


class ConsultationRequestRespond(BaseModel):
    notes: str
    recommendations: str