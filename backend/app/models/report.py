import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Enum as SAEnum, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base
import enum

class ReportType(str, enum.Enum):
    SKIN_ASSESSMENT = "SKIN_ASSESSMENT"
    PERSONALIZED_ROUTINE = "PERSONALIZED_ROUTINE"
    PRODUCT_RECOMMENDATION = "PRODUCT_RECOMMENDATION"
    PROGRESS_LONGITUDINAL = "PROGRESS_LONGITUDINAL"
    COMPREHENSIVE_5PILLAR = "COMPREHENSIVE_5PILLAR"

class ExportFormat(str, enum.Enum):
    PDF = "PDF"
    EXCEL = "EXCEL"
    JSON = "JSON"

class ReportRecord(Base):
    __tablename__ = "report_records"
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    generated_by_id = Column(Uuid, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    report_type = Column(SAEnum(ReportType), nullable=False)
    export_format = Column(SAEnum(ExportFormat), nullable=False, default=ExportFormat.JSON)
    title = Column(String(300), nullable=False)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    user = relationship("User", foreign_keys=[user_id], lazy="select")
