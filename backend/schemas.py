from datetime import date, datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, EmailStr, Field


# ─────────────────────────────────────────────
# Auth / User schemas
# ─────────────────────────────────────────────

VALID_ROLES = {"user", "skincare_consultant", "dermatologist", "admin"}


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int = Field(ge=1, le=120)
    gender: str = Field(min_length=1, max_length=50)
    phone: Optional[str] = None
    role: Optional[str] = "user"   # user | skincare_consultant | dermatologist


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: int
    gender: str
    phone: Optional[str] = None
    bio: Optional[str] = None
    role: str
    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class RoleUpdateRequest(BaseModel):
    role: str


# ─────────────────────────────────────────────
# Skin Profile schemas
# ─────────────────────────────────────────────

class ProfileRequest(BaseModel):
    skin_type: str
    age_group: str
    skin_concerns: List[str] = []
    allergies: Optional[Any] = []
    sensitivities: Optional[Any] = []
    lifestyle_habits: Optional[Any] = []
    sleep_quality: str = "Good"
    water_intake: float = Field(ge=0, le=100, default=2.0)
    sun_exposure: Optional[str] = "Moderate"
    pollution_exposure: Optional[str] = "Moderate"
    climate_type: Optional[str] = "Temperate"
    uv_index_exposure: Optional[str] = "Moderate"
    region: Optional[str] = "Urban"


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    skin_type: str
    age_group: str
    skin_concerns: Any
    allergies: Any
    sensitivities: Any
    lifestyle_habits: Any
    sleep_quality: str
    water_intake: float
    sun_exposure: Optional[str] = ""
    pollution_exposure: Optional[str] = ""
    climate_type: Optional[str] = ""
    uv_index_exposure: Optional[str] = ""
    region: Optional[str] = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Sleep Log schemas
# ─────────────────────────────────────────────

class SleepLogRequest(BaseModel):
    log_date: Optional[date] = None
    sleep_hours: float = Field(ge=0, le=24)
    bedtime: Optional[str] = None
    wakeup_time: Optional[str] = None
    sleep_quality: Optional[int] = Field(None, ge=1, le=10)
    quality: Optional[str] = "Good"
    consistency: Optional[int] = Field(None, ge=1, le=10)
    notes: Optional[str] = None


class SleepLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    sleep_hours: float
    bedtime: Optional[str]
    wakeup_time: Optional[str]
    sleep_quality: Optional[int] = 7
    quality: Optional[str] = "Good"
    consistency: Optional[int] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Hydration Log schemas
# ─────────────────────────────────────────────

class HydrationLogRequest(BaseModel):
    log_date: Optional[date] = None
    water_litres: float = Field(ge=0, le=50)
    glasses_of_water: Optional[int] = Field(None, ge=0, le=200)
    glasses: Optional[int] = Field(None, ge=0, le=200)
    notes: Optional[str] = None


class HydrationLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    water_litres: float
    glasses_of_water: Optional[int] = 8
    glasses: Optional[int] = None
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Lifestyle Log schemas
# ─────────────────────────────────────────────

class LifestyleLogRequest(BaseModel):
    log_date: Optional[date] = None
    exercise_minutes: Optional[int] = Field(None, ge=0, le=1440)
    diet_quality: Optional[int] = Field(None, ge=1, le=5)
    stress_level: Optional[int] = Field(None, ge=1, le=5)
    smoking: bool = False
    alcohol: bool = False
    sun_exposure_hours: Optional[float] = 1.0
    notes: Optional[str] = None


class LifestyleLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    exercise_minutes: Optional[int] = 30
    diet_quality: Optional[int] = 3
    stress_level: Optional[int] = 3
    smoking: bool = False
    alcohol: bool = False
    sun_exposure_hours: Optional[float] = 1.0
    notes: Optional[str] = None
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Skin Assessment & AI Scanner schemas
# ─────────────────────────────────────────────

class AssessmentResponse(BaseModel):
    id: int
    user_id: int
    overall_score: float
    condition_score: float
    lifestyle_score: float
    sleep_score: float
    consistency_score: float
    hydration_score: float
    concern_priorities: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
    recommendation_summary: str
    model_config = {"from_attributes": True}


class FaceScanRequest(BaseModel):
    image_base64: str


class ApplyScanRequest(BaseModel):
    detected_concerns: List[str]
    skin_score: Optional[float] = None


# ─────────────────────────────────────────────
# Skincare Routine schemas
# ─────────────────────────────────────────────

class RoutineStep(BaseModel):
    id: str
    step_number: int
    category: str
    product_name: str
    instructions: str
    frequency: str = "Daily"
    active_ingredients: List[str] = []


class SkincareRoutineResponse(BaseModel):
    id: int
    user_id: int
    morning_routine: List[RoutineStep]
    evening_routine: List[RoutineStep]
    weekly_routine: List[RoutineStep]
    seasonal_routine: List[RoutineStep]
    updated_at: datetime
    model_config = {"from_attributes": True}


class ChecklistUpdateRequest(BaseModel):
    completed_steps: List[str]


class RoutineChecklistResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    completed_steps: List[str]
    total_steps: int
    completion_rate: float
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Ingredient & Product schemas
# ─────────────────────────────────────────────

class IngredientResponse(BaseModel):
    id: int
    name: str
    category: str
    description: str
    key_benefits: List[str]
    suitable_skin_types: List[str]
    conflicting_ingredients: List[str]
    synergistic_ingredients: List[str]
    allergen_warning: str
    model_config = {"from_attributes": True}


class FormulaAnalyzeRequest(BaseModel):
    ingredient_names: List[str]


class ProductResponse(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    price: float
    price_tier: str
    suitable_skin_types: List[str]
    target_concerns: List[str]
    key_ingredients: List[str]
    rating: float
    image_url: str
    suitability_score: Optional[float] = None
    model_config = {"from_attributes": True}


class ProductCompareRequest(BaseModel):
    product_ids: List[int]


# ─────────────────────────────────────────────
# Progress Tracking schemas
# ─────────────────────────────────────────────

class ProgressLogRequest(BaseModel):
    log_date: Optional[date] = None
    condition_rating: Optional[int] = None
    skin_condition_rating: Optional[int] = None
    active_concerns: List[str] = []
    concerns_severity: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    photo_url: Optional[str] = None


class ProgressLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    condition_rating: int
    active_concerns: List[str]
    notes: Optional[str]
    photo_url: Optional[str]
    model_config = {"from_attributes": True}


# ─────────────────────────────────────────────
# Schema Aliases
# ─────────────────────────────────────────────

RoutineResponse = Any
ChecklistRequest = ChecklistUpdateRequest
ChecklistResponse = RoutineChecklistResponse
FormulaAnalysisRequest = FormulaAnalyzeRequest
FormulaAnalysisResponse = Dict[str, Any]
ProductComparisonRequest = ProductCompareRequest
ProgressAnalyticsResponse = Dict[str, Any]
