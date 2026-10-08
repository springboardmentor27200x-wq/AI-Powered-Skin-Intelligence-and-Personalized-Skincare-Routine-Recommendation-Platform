from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.hydration import HydrationRecord
from app.models.user import User
from app.schemas.hydration import HydrationCreate, HydrationUpdate, HydrationResponse

router = APIRouter()


@router.get("", response_model=List[HydrationResponse])
def get_hydration_records(
    record_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve hydration tracking logs for the authenticated user."""
    query = db.query(HydrationRecord).filter(HydrationRecord.user_id == current_user.id)
    if record_date:
        query = query.filter(HydrationRecord.record_date == record_date)
        
    return query.order_by(HydrationRecord.record_date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=HydrationResponse, status_code=status.HTTP_201_CREATED)
def create_hydration_record(
    record_in: HydrationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new hydration pattern log. Prevents duplicate logs for the same day."""
    existing = db.query(HydrationRecord).filter(
        HydrationRecord.user_id == current_user.id,
        HydrationRecord.record_date == record_in.record_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A hydration record already exists for date {record_in.record_date}. Use PATCH to update."
        )

    record = HydrationRecord(
        user_id=current_user.id,
        **record_in.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{record_id}", response_model=HydrationResponse)
def update_hydration_record(
    record_id: UUID,
    record_in: HydrationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific hydration record. Restricts access to resource owner."""
    record = db.query(HydrationRecord).filter(HydrationRecord.id == record_id).first()
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
def delete_hydration_record(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific hydration record. Restricts access to resource owner."""
    record = db.query(HydrationRecord).filter(HydrationRecord.id == record_id).first()
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
