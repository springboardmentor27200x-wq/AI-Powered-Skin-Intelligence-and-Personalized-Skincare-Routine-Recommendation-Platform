from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_active_user
from app.models.user import User
from app.schemas.sleep import (
    SleepRecordCreate,
    SleepRecordUpdate,
    SleepRecordResponse,
    SleepHistoryResponse,
)
from app.services.sleep_service import sleep_service

router = APIRouter(prefix="/sleep", tags=["Sleep"])


@router.get("", response_model=SleepHistoryResponse)
def get_sleep_history(
    limit: int = Query(30, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Retrieve sleep records history and average sleep duration."""
    return sleep_service.get_user_sleep_history(db, current_user.id, limit=limit)


@router.post("", response_model=SleepRecordResponse, status_code=status.HTTP_201_CREATED)
def log_sleep_record(
    record_in: SleepRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Log a new sleep entry."""
    return sleep_service.create_sleep_record(db, current_user.id, record_in)


@router.put("/{id}", response_model=SleepRecordResponse)
def update_sleep_record(
    id: int,
    record_in: SleepRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a specific sleep record."""
    return sleep_service.update_sleep_record(db, current_user.id, id, record_in)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_sleep_record(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a specific sleep record."""
    sleep_service.delete_sleep_record(db, current_user.id, id)
    return {"detail": "Sleep record deleted successfully."}
