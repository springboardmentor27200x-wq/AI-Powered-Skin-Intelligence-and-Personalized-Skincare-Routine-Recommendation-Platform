from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.dashboard import DashboardSummaryResponse, ProgressAnalyticsResponse
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_user_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve full aggregated dashboard summary metrics for the authenticated user."""
    return dashboard_service.get_user_dashboard(db, current_user)


@router.get("/progress", response_model=ProgressAnalyticsResponse)
def get_user_progress_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Return skin health progress, trends, and alerts for the authenticated user."""
    return dashboard_service.get_progress_analytics(db, current_user)
