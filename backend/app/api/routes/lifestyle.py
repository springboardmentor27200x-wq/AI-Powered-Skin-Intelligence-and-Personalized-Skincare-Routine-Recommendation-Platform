from datetime import date
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.lifestyle import LifestyleRecord
from app.models.user import User
from app.schemas.lifestyle import LifestyleCreate, LifestyleUpdate, LifestyleResponse

router = APIRouter()


@router.get("", response_model=List[LifestyleResponse])
def get_lifestyle_records(
    record_date: Optional[date] = None,
    limit: int = 100,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve list of lifestyle tracking records for the authenticated user."""
    query = db.query(LifestyleRecord).filter(LifestyleRecord.user_id == current_user.id)
    if record_date:
        query = query.filter(LifestyleRecord.record_date == record_date)
    
    return query.order_by(LifestyleRecord.record_date.desc()).offset(offset).limit(limit).all()


@router.post("", response_model=LifestyleResponse, status_code=status.HTTP_201_CREATED)
def create_lifestyle_record(
    record_in: LifestyleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new lifestyle tracking record. Prevents duplicates on the same date."""
    # Check if entry already exists for the given record_date
    existing = db.query(LifestyleRecord).filter(
        LifestyleRecord.user_id == current_user.id,
        LifestyleRecord.record_date == record_in.record_date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A lifestyle record already exists for date {record_in.record_date}. Use PATCH to update."
        )

    record = LifestyleRecord(
        user_id=current_user.id,
        **record_in.model_dump()
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.patch("/{record_id}", response_model=LifestyleResponse)
def update_lifestyle_record(
    record_id: UUID,
    record_in: LifestyleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a specific lifestyle record. Restricts access to the resource owner."""
    record = db.query(LifestyleRecord).filter(LifestyleRecord.id == record_id).first()
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
def delete_lifestyle_record(
    record_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a specific lifestyle record. Restricts access to the resource owner."""
    record = db.query(LifestyleRecord).filter(LifestyleRecord.id == record_id).first()
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
