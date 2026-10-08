"""
DermaIQ Report & Export API Endpoints — Module 11
=================================================
Provides endpoints to generate, preview, and download PDF and Excel reports.
Enforces strict RBAC authorization:
- USER: Access own reports only.
- SKINCARE_CONSULTANT: Access authorized clients only.
- DERMATOLOGIST: Access authorized patients only.
- ADMINISTRATOR: Access all platform-level reports.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.connection import ProfessionalConnection
from app.models.report import ReportType, ExportFormat
from app.schemas.report import (
    ReportDataResponse,
    ReportHistoryResponse,
    ReportRecordResponse,
)
from app.services.report_service import ReportService
from app.services.intelligence import summary_engine

router = APIRouter()


def _verify_report_access(db: Session, requester: User, target_user_id: uuid.UUID) -> User:
    """
    Validates that requester is authorized to view target_user_id's clinical reports.
    Prevents IDOR and privilege escalation.
    """
    if requester.id == target_user_id:
        return requester

    if requester.role == "ADMINISTRATOR":
        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")
        return target

    if requester.role in ("SKINCARE_CONSULTANT", "DERMATOLOGIST"):
        conn = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.professional_id == requester.id,
            ProfessionalConnection.user_id == target_user_id,
            ProfessionalConnection.status == "ACCEPTED",
        ).first()
        if not conn:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: No active clinical connection with this client.",
            )
        target = db.query(User).filter(User.id == target_user_id).first()
        if not target:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found")
        return target

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied: Unauthorized to view this report.")


@router.get("/ai-status", summary="Check active AI LLM provider status for report summaries")
def get_ai_status():
    """Returns status of free online AI models (Groq, OpenRouter, Gemini, and Rule Engine fallback)."""
    return summary_engine.get_provider_status()


@router.get("/preview", summary="Generate preview data and AI executive briefing")
async def preview_report(
    report_type: ReportType = Query(ReportType.SKIN_ASSESSMENT),
    assessment_id: Optional[uuid.UUID] = Query(None),
    include_ai_summary: bool = Query(True),
    target_user_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_id = target_user_id or uuid.UUID(str(current_user.id))
    target_user = _verify_report_access(db, current_user, target_id)
    data = await ReportService.gather_report_data(
        db=db,
        user=target_user,
        report_type=report_type,
        assessment_id=assessment_id,
        include_ai_summary=include_ai_summary,
    )
    return data


@router.get("/export/pdf", summary="Download report as clinical PDF document")
async def export_pdf(
    report_type: ReportType = Query(ReportType.SKIN_ASSESSMENT),
    assessment_id: Optional[uuid.UUID] = Query(None),
    include_ai_summary: bool = Query(True),
    target_user_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_id = target_user_id or uuid.UUID(str(current_user.id))
    target_user = _verify_report_access(db, current_user, target_id)
    data = await ReportService.gather_report_data(
        db=db,
        user=target_user,
        report_type=report_type,
        assessment_id=assessment_id,
        include_ai_summary=include_ai_summary,
    )
    pdf_buffer = ReportService.generate_pdf(data)

    target_uid = uuid.UUID(str(target_user.id))
    current_uid = uuid.UUID(str(current_user.id))
    ReportService.record_export(
        db=db,
        user_id=target_uid,
        report_type=report_type,
        export_format=ExportFormat.PDF,
        title=data["title"],
        assessment_id=assessment_id,
        generated_by_id=current_uid,
    )

    filename = f"DermaIQ_{report_type.value}_{target_user.id}_{int(datetime.now(timezone.utc).timestamp())}.pdf"
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/export/excel", summary="Download report as structured multi-sheet Excel workbook")
async def export_excel(
    report_type: ReportType = Query(ReportType.SKIN_ASSESSMENT),
    assessment_id: Optional[uuid.UUID] = Query(None),
    include_ai_summary: bool = Query(True),
    target_user_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_id = target_user_id or uuid.UUID(str(current_user.id))
    target_user = _verify_report_access(db, current_user, target_id)
    data = await ReportService.gather_report_data(
        db=db,
        user=target_user,
        report_type=report_type,
        assessment_id=assessment_id,
        include_ai_summary=include_ai_summary,
    )
    excel_buffer = ReportService.generate_excel(data)

    target_uid = uuid.UUID(str(target_user.id))
    current_uid = uuid.UUID(str(current_user.id))
    ReportService.record_export(
        db=db,
        user_id=target_uid,
        report_type=report_type,
        export_format=ExportFormat.EXCEL,
        title=data["title"],
        assessment_id=assessment_id,
        generated_by_id=current_uid,
    )

    filename = f"DermaIQ_{report_type.value}_{target_user.id}_{int(datetime.now(timezone.utc).timestamp())}.xlsx"
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/history", response_model=ReportHistoryResponse, summary="Get audit trail of previously generated reports")
def get_report_history(
    target_user_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    target_id = target_user_id or uuid.UUID(str(current_user.id))
    target_user = _verify_report_access(db, current_user, target_id)
    target_uid = uuid.UUID(str(target_user.id))
    records = ReportService.get_report_history(db, target_uid, limit=limit)
    return {
        "reports": records,
        "total": len(records),
    }
