import re
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from models.user import UserRole

# Standard regex pattern for email validation
EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

def validate_email_format(email: str) -> str:
    if not EMAIL_REGEX.match(email):
        raise ValueError("Invalid email format")
    return email.lower().strip()


# ============================================================
# USER SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str
    password: str = Field(..., min_length=6, max_length=100)
    role: Optional[UserRole] = UserRole.USER

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_format(v)


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_format(v)


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    role: UserRole
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TOKEN SCHEMAS
# ============================================================

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None


# ============================================================
# MOCK OAUTH SCHEMA
# ============================================================

class OAuthMockRequest(BaseModel):
    provider: str  # google, apple
    oauth_token: str
    email: str
    full_name: str
    role: Optional[UserRole] = UserRole.USER

    @field_validator("email")
    @classmethod
    def check_email(cls, v: str) -> str:
        return validate_email_format(v)


# ============================================================
# SKIN PROFILE SCHEMAS
# ============================================================

class SkinProfileCreate(BaseModel):
    skin_type: str = Field(..., description="Dry, Oily, Combination, Normal, Sensitive")
    age_group: str = Field(..., description="Under 18, 18-24, 25-34, 35-44, 45-54, 55+")
    skin_concerns: List[str] = Field(default=[], description="List of concerns")
    allergies: List[str] = Field(default=[], description="List of allergies")
    sensitivities: List[str] = Field(default=[], description="List of sensitivities")


class SkinProfileOut(BaseModel):
    id: int
    user_id: int
    skin_type: str
    age_group: str
    skin_concerns: List[str]
    allergies: List[str]
    sensitivities: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# LIFESTYLE LOG SCHEMAS
# ============================================================

class LifestyleLogCreate(BaseModel):
    log_date: date
    sleep_hours: float = Field(..., ge=0.0, le=24.0)
    sleep_quality: str = Field(..., description="Poor, Fair, Good, Excellent")
    water_intake_ml: int = Field(..., ge=0)
    uv_exposure: Optional[str] = Field(None, description="None, Low, Moderate, High")
    pollution_exposure: Optional[str] = Field(None, description="Low, Moderate, High")
    stress_level: Optional[str] = Field(None, description="Low, Medium, High")
    sunscreen_applied: bool = Field(default=False)


class LifestyleLogOut(BaseModel):
    id: int
    user_id: int
    log_date: date
    sleep_hours: float
    sleep_quality: str
    water_intake_ml: int
    uv_exposure: Optional[str]
    pollution_exposure: Optional[str]
    stress_level: Optional[str]
    sunscreen_applied: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LifestyleLogStats(BaseModel):
    avg_sleep_hours: float
    avg_water_intake_ml: float
    sunscreen_compliance_rate: float
    total_logs: int


# ============================================================
# SKIN ASSESSMENT SCHEMAS  (Module 3)
# ============================================================

class ScoreFactorOut(BaseModel):
    raw_score: float
    weight: float
    weighted_contribution: float
    description: str


class ConcernAnalysisOut(BaseModel):
    concern: str
    score: int
    severity: str   # Critical | Moderate | Low
    modifiers_applied: List[str]
    explanation: str
    recommended_focus: bool


class RiskFactorOut(BaseModel):
    risk: str
    severity: str   # High | Moderate | Low
    description: str
    recommended_action: str


class AssessmentOut(BaseModel):
    id: int
    user_id: int
    overall_score: float
    score_breakdown: Dict[str, Any]
    concern_analysis: List[Dict[str, Any]]
    risk_factors: List[Dict[str, Any]]
    lifestyle_snapshot: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentRunResponse(BaseModel):
    """Response returned immediately after running an assessment."""
    assessment: AssessmentOut
    summary: str


# ============================================================
# SKINCARE ROUTINE SCHEMAS  (Module 4)
# ============================================================

class RoutineStepOut(BaseModel):
    step: int
    name: str
    product_type: str
    key_ingredients: List[str]
    why: str
    application: str


class WeeklyTreatmentOut(BaseModel):
    name: str
    frequency: str
    product_type: str
    key_ingredients: List[str]
    duration: str
    why: str
    application: str


class SeasonalTipOut(BaseModel):
    season: str
    tip: str
    detail: str


class IngredientHighlightOut(BaseModel):
    ingredient: str
    category: str
    benefits: str
    note: Optional[str] = ""


class RoutineOut(BaseModel):
    id: int
    user_id: int
    morning_routine: List[Dict[str, Any]]
    evening_routine: List[Dict[str, Any]]
    weekly_treatments: List[Dict[str, Any]]
    seasonal_tips: List[Dict[str, Any]]
    generated_for_skin_type: str
    generated_for_concerns: List[str]
    created_at: datetime

    class Config:
        from_attributes = True


class RoutineGenerateResponse(BaseModel):
    """Response returned after generating a routine."""
    routine: RoutineOut
    ingredient_highlights: List[Dict[str, Any]]


# ============================================================
# PRODUCT & PROGRESS SCHEMAS (Milestone 3)
# ============================================================

class ProductBase(BaseModel):
    name: str
    brand: str
    category: str
    description: str
    price: str
    image_url: Optional[str] = None
    ingredients: List[str] = []
    target_skin_types: List[str] = []
    target_concerns: List[str] = []
    is_active: bool = True

class ProductOut(ProductBase):
    id: int

    class Config:
        from_attributes = True

class ProgressLogCreate(BaseModel):
    skin_health_score: float
    notes: Optional[str] = None
    routine_adherence: int = 100

class ProgressLogOut(BaseModel):
    id: int
    user_id: int
    date_logged: datetime
    skin_health_score: float
    notes: Optional[str]
    routine_adherence: int

    class Config:
        from_attributes = True


# ============================================================
# SKIN TEXTURE VISION ANALYSIS SCHEMAS
# ============================================================

class SkinTextureAnalysisOut(BaseModel):
    id: Optional[int] = None
    smoothness_score: float
    roughness_score: float
    pore_visibility_score: float
    pore_density_score: float
    oiliness_shine_score: float
    redness_erythema_score: float
    fine_lines_score: float
    overall_texture_score: float
    texture_type: str
    primary_concern: Optional[str] = None
    analysis_summary: Optional[str] = None
    diagnostics: Optional[Dict[str, Any]] = None
    overlays: Optional[Dict[str, str]] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
