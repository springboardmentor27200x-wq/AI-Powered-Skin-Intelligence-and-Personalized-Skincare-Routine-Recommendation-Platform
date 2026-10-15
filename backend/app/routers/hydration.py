from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.hydration import (
    HydrationRecordCreate,
    HydrationRecordResponse,
    HydrationSummaryResponse,
)
from app.services.hydration_service import hydration_service

router = APIRouter(prefix="/hydration", tags=["Hydration"])


@router.get("", response_model=HydrationSummaryResponse)
def get_hydration_summary(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve hydration history records and today's total water intake."""
    return hydration_service.get_hydration_summary(db, current_user.id, limit=limit)


@router.post("", response_model=HydrationRecordResponse, status_code=status.HTTP_201_CREATED)
def log_water_intake(
    record_in: HydrationRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Log a new water intake entry."""
    return hydration_service.create_hydration_record(db, current_user.id, record_in)


@router.put("/{id}", response_model=HydrationRecordResponse)
def update_water_intake(
    id: int,
    record_in: HydrationRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a specific water intake entry."""
    return hydration_service.update_hydration_record(
        db, current_user.id, id, record_in.water_intake_ml, record_in.record_date
    )


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_water_intake(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a specific water intake entry."""
    hydration_service.delete_hydration_record(db, current_user.id, id)
    return {"detail": "Hydration record deleted successfully."}
