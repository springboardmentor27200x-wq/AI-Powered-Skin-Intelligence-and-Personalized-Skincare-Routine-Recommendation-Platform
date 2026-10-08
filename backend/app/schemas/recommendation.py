from datetime import datetime
from typing import Any, Dict, List, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


# ---------------------------------------------------------------------------
# Routine Adherence Schemas
# ---------------------------------------------------------------------------

class RoutineAdherenceToggleRequest(BaseModel):
    routine_step_id: uuid.UUID
    record_date: Optional[str] = None  # YYYY-MM-DD, defaults to today
    completed: Optional[bool] = None  # if None, toggles current value


class RoutineAdherenceRecordResponse(BaseModel):
    id: uuid.UUID
    routine_step_id: uuid.UUID
    record_date: str
    completed: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RoutineAdherenceDaySummary(BaseModel):
    record_date: str
    completed_steps: int
    total_steps: int
    completion_rate: float  # 0.0 - 1.0


class RoutineAdherenceSummaryResponse(BaseModel):
    adherence_score: int  # 0 - 100
    streak_days: int
    total_logged_days: int
    weekly_completion_rate: float
    history_7d: List[RoutineAdherenceDaySummary] = Field(default_factory=list)
    today_completed_step_ids: List[str] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Professional Recommendation Schemas
# ---------------------------------------------------------------------------

class ProfessionalRecommendationCreate(BaseModel):
    patient_id: uuid.UUID
    title: str = Field(..., min_length=3, max_length=200)
    clinical_notes: str = Field(..., min_length=10)
    prescribed_actives: Optional[List[str]] = Field(default_factory=list)
    recommended_products: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    contraindications: Optional[List[str]] = Field(default_factory=list)
    follow_up_weeks: Optional[int] = 4


class ProfessionalRecommendationResponse(BaseModel):
    id: uuid.UUID
    connection_id: Optional[uuid.UUID] = None
    professional_id: uuid.UUID
    patient_id: uuid.UUID
    professional_name: Optional[str] = None
    professional_role: Optional[str] = None
    title: str
    clinical_notes: str
    prescribed_actives: Optional[List[str]] = None
    recommended_products: Optional[List[Dict[str, Any]]] = None
    contraindications: Optional[List[str]] = None
    follow_up_weeks: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# 7-Day Barrier Forecast Schemas
# ---------------------------------------------------------------------------

class BarrierForecastDay(BaseModel):
    day_offset: int
    forecast_date: str
    barrier_score: int
    status: str  # "STRENGTHENING", "OPTIMAL", "STABILIZING", "VULNERABLE"
    tewl_risk_index: float  # Transepidermal Water Loss risk (0.0 low - 1.0 high)
    confidence: float
    notes: str


class BarrierForecastResponse(BaseModel):
    current_barrier_score: int
    projected_7d_score: int
    projected_net_change: int
    barrier_status: str
    trajectory: List[BarrierForecastDay] = Field(default_factory=list)
    clinical_advisory_tips: List[str] = Field(default_factory=list)
