from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class AssessmentConcernResponse(BaseModel):
    id: uuid.UUID
    concern_name: str
    priority: str  # HIGH, MEDIUM, LOW
    severity: int  # 0 - 100
    confidence: float
    reasons: Optional[List[str]] = None
    ml_probability: Optional[float] = None   # AI model probability (0-1)
    assessment_mode: Optional[str] = None    # AI_ASSISTED | RULE_BASED_FALLBACK

    model_config = ConfigDict(from_attributes=True)


class RiskFactorResponse(BaseModel):
    id: uuid.UUID
    factor_type: str
    factor_name: str
    impact_level: str  # HIGH, MODERATE, LOW
    impact_score: int
    description: Optional[str] = None
    ml_probability: Optional[float] = None   # AI model probability (0-1)
    assessment_mode: Optional[str] = None    # AI_ASSISTED | RULE_BASED_FALLBACK

    model_config = ConfigDict(from_attributes=True)


class SkinScoreResponse(BaseModel):
    skin_condition_score: int
    lifestyle_score: int
    sleep_score: int
    routine_consistency_score: int
    hydration_score: int
    overall_score: int
    explanation: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class AIAnalysisResponse(BaseModel):
    """Raw AI/ML model outputs returned alongside the assessment."""
    assessment_mode: str  # AI_ASSISTED | RULE_BASED_FALLBACK | AI_ANALYSIS_UNAVAILABLE
    model_version: Optional[str] = None
    concern_predictions: List[Dict[str, Any]] = Field(default_factory=list)
    risk_predictions: List[Dict[str, Any]] = Field(default_factory=list)
    disclaimer: str = "AI-assisted skin concern assessment. Not a medical diagnosis."


class SkinAssessmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    assessment_date: datetime
    overall_score: int
    status: str
    summary: Optional[str] = None
    assessment_mode: Optional[str] = None  # AI_ASSISTED | RULE_BASED_FALLBACK
    created_at: datetime
    concerns: List[AssessmentConcernResponse] = Field(default_factory=list)
    risk_factors: List[RiskFactorResponse] = Field(default_factory=list)
    scores: Optional[SkinScoreResponse] = None
    ai_analysis: Optional[AIAnalysisResponse] = None

    model_config = ConfigDict(from_attributes=True)


class AssessmentPrecheckResponse(BaseModel):
    has_profile: bool
    name: Optional[str] = None
    age_group: Optional[str] = None
    skin_type: Optional[str] = None
    concerns: List[str] = Field(default_factory=list)
    allergies: Optional[str] = None
    sensitivities: Optional[str] = None
    stress_level: Optional[int] = None
    sleep_hours: Optional[float] = None
    sleep_quality: Optional[str] = None
    water_intake_ml: Optional[int] = None
    target_water_ml: Optional[int] = None
    has_previous_assessment: bool
    last_assessment_date: Optional[datetime] = None
    last_score: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
