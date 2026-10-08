import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.models.report import ReportType, ExportFormat

class ReportGenerateRequest(BaseModel):
    report_type: ReportType = ReportType.SKIN_ASSESSMENT
    assessment_id: Optional[uuid.UUID] = None
    include_ai_summary: bool = True

class ReportRecordResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    report_type: ReportType
    export_format: ExportFormat
    title: str
    assessment_id: Optional[uuid.UUID] = None
    created_at: datetime
    class Config:
        from_attributes = True

class ReportHistoryResponse(BaseModel):
    reports: List[ReportRecordResponse]
    total: int

class ReportDataResponse(BaseModel):
    report_type: str
    title: str
    generated_at: str
    user_name: str
    overall_score: float
    scores: Dict[str, Any]
    concerns: List[Dict[str, Any]]
    routine_steps: List[Dict[str, Any]]
    products: List[Dict[str, Any]]
    ai_summary: str
    disclaimer: str
