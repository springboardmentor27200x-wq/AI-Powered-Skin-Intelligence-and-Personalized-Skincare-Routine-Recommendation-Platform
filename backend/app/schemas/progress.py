from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AdherenceLog(BaseModel):
    date: str
    morning_completed: bool
    evening_completed: bool
    notes: Optional[str] = None

class ProgressAnalyticsResponse(BaseModel):
    user_id: int
    adherence_rate: float # 0 to 100 percentage
    adherence_logs: List[AdherenceLog]
    score_history: List[dict] # list of dicts with date and overall_score
    generated_at: datetime
