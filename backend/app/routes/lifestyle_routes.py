from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Lifestyle, User
from ..schemas import LifestyleCreate, LifestyleResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/api/lifestyle",
    tags=["Lifestyle"]
)


@router.post("/", response_model=LifestyleResponse)
def create_lifestyle(
    lifestyle: LifestyleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can only create their own lifestyle records.
    # Admin, consultant and dermatologist can create for other users.
    if (
        current_user.id != lifestyle.user_id
        and current_user.role not in ("admin", "consultant", "dermatologist")
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create your own lifestyle record."
        )

    user = db.query(User).filter(
        User.id == lifestyle.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_record = Lifestyle(
        user_id=lifestyle.user_id,
        water_intake=lifestyle.water_intake,
        exercise_minutes=lifestyle.exercise_minutes,
        stress_level=lifestyle.stress_level
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/{user_id}", response_model=list[LifestyleResponse])
def get_lifestyle(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can only view their own records.
    if (
        current_user.id != user_id
        and current_user.role not in ("admin", "consultant", "dermatologist")
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own lifestyle records."
        )

    records = db.query(Lifestyle).filter(
        Lifestyle.user_id == user_id
    ).all()

    return records