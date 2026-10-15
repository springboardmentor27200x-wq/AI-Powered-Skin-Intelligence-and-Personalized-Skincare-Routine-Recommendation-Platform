from io import BytesIO
from typing import Literal

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_active_user
from app.dependencies.database import get_db
from app.models.user import User
from app.services.report_service import build_progress_report

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/progress")
def export_progress_report(
    format: Literal["pdf", "xlsx"] = "pdf",
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    content, media_type, filename = build_progress_report(db, current_user, format)
    return StreamingResponse(
        BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )