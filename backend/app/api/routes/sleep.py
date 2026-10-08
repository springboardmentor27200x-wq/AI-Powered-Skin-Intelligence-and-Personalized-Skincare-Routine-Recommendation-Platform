from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.sleep import SleepRecord
from app.models.user import User
from app.schemas.sleep import SleepCreate, SleepUpdate, SleepResponse

router = APIRouter()


@router.get("", response_model=List[SleepResponse])
def get_sleep_records(
    record_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve sleep tracking logs for the authenticated user."""
    query = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id)
    if record_date:
        query = query.filter(SleepRecord.record_date == record_date)
        
    return query.order_by(SleepRecord.record_date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=SleepResponse, status_code=status.HTTP_201_CREATED)
def create_sleep_record(
    record_in: SleepCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new sleep pattern log. Prevents duplicate logs for the same day."""
    existing = db.query(SleepRecord).filter(
        SleepRecord.user_id == current_user.id,
        SleepRecord.record_date == record_in.record_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A sleep record already exists for date {record_in.record_date}. Use PATCH to update."
        )

    record = SleepRecord(
        user_id=current_user.id,
        **record_in.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{record_id}", response_model=SleepResponse)
def update_sleep_record(
    record_id: UUID,
    record_in: SleepUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific sleep record. Restricts access to resource owner."""
    record = db.query(SleepRecord).filter(SleepRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
        
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this record"
        )

    update_data = record_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sleep_record(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific sleep record. Restricts access to resource owner."""
    record = db.query(SleepRecord).filter(SleepRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Record not found"
        )
        
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this record"
        )

    db.delete(record)
    db.commit()
    return
