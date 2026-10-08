from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel


class ScoreDelta(BaseModel):
    """Change in a specific pillar score between two assessments."""
    pillar: str                        # e.g. "Hydration", "Sleep", "Skin Condition"
    previous: Optional[int] = None
    current: Optional[int] = None
    delta: Optional[int] = None        # current - previous (positive = improvement)
    direction: str = "unchanged"       # improved | declined | unchanged


class ProgressSummary(BaseModel):
    """Overall progress summary: latest vs previous assessment."""
    has_data: bool
    assessment_count: int
    current_score: Optional[int] = None
    previous_score: Optional[int] = None
    overall_delta: Optional[int] = None
    pillar_deltas: List[ScoreDelta] = []
    assessment_date: Optional[str] = None
    previous_date: Optional[str] = None
    message: Optional[str] = None      # Friendly summary message


class TrendPoint(BaseModel):
    date: str                          # YYYY-MM-DD
    score: int
    assessment_id: Optional[str] = None


class TrendData(BaseModel):
    """Time-series trend data for a specific metric."""
    metric: str                        # overall_score | hydration | sleep | etc.
    period: str                        # 7d | 30d | 90d | all
    data_points: List[TrendPoint]
    insufficient_data: bool = False


class TrendResponse(BaseModel):
    overall: TrendData
    skin_condition: TrendData
    lifestyle: TrendData
    sleep: TrendData
    hydration: TrendData
    routine_consistency: TrendData
    period: str


class ConcernTrendPoint(BaseModel):
    date: str
    severity: int


class ConcernTrend(BaseModel):
    concern: str
    data_points: List[ConcernTrendPoint]


class AdherenceStepItem(BaseModel):
    """A routine step for today's interactive checklist."""
    id: str
    title: str
    routine_type: str                  # MORNING, EVENING
    step_order: int = 1
    completed: bool = False


class AdherenceStats(BaseModel):
    """Routine adherence statistics calculated from persisted RoutineAdherenceRecords."""
    today_completed: int
    today_total: int
    today_percent: Optional[float] = None
    week_completed: int
    week_total: int
    week_percent: Optional[float] = None
    streak_days: int
    has_routine: bool
    today_steps: List[AdherenceStepItem] = []


class AssessmentHistoryItem(BaseModel):
    assessment_id: str
    date: str
    overall_score: int
    skin_condition_score: Optional[int] = None
    lifestyle_score: Optional[int] = None
    sleep_score: Optional[int] = None
    hydration_score: Optional[int] = None
    routine_consistency_score: Optional[int] = None
    top_concerns: List[str] = []
    concern_values: Optional[Dict[str, int]] = None


class ConcernDelta(BaseModel):
    """Change in a specific skin concern severity between two assessments."""
    concern: str
    baseline_severity: Optional[int] = None
    target_severity: Optional[int] = None
    delta: Optional[int] = None        # baseline - target (positive = severity reduced / improved)
    status: str                        # resolved | improved | worsened | new | unchanged


class AssessmentComparison(BaseModel):
    """Detailed side-by-side comparison between two assessments."""
    has_comparison: bool
    baseline_id: Optional[str] = None
    target_id: Optional[str] = None
    baseline_date: Optional[str] = None
    target_date: Optional[str] = None
    days_apart: Optional[int] = None
    baseline_score: Optional[int] = None
    target_score: Optional[int] = None
    overall_delta: Optional[int] = None
    direction: Optional[str] = None    # improved | declined | unchanged
    pillar_deltas: List[ScoreDelta] = []
    concern_deltas: List[ConcernDelta] = []
    summary_text: Optional[str] = None
    available_assessments: List[AssessmentHistoryItem] = []

