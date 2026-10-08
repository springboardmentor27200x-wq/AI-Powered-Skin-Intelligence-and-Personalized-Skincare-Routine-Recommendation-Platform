from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Sleep, User
from ..schemas import SleepCreate, SleepResponse
from ..dependencies import get_current_user


router = APIRouter(
    prefix="/api/sleep",
    tags=["Sleep"]
)


@router.post("/", response_model=SleepResponse)
def create_sleep(
    sleep: SleepCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Users can only create their own sleep records.
    # Admin, consultant and dermatologist can create for other users.
    if (
        current_user.id != sleep.user_id
        and current_user.role not in ("admin", "consultant", "dermatologist")
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only create your own sleep record."
        )

    user = db.query(User).filter(
        User.id == sleep.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_record = Sleep(
        user_id=sleep.user_id,
        sleep_hours=sleep.sleep_hours,
        sleep_quality=sleep.sleep_quality,
        date=sleep.date
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@router.get("/{user_id}", response_model=list[SleepResponse])
def get_sleep(
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
            detail="You can only view your own sleep records."
        )

    records = db.query(Sleep).filter(
        Sleep.user_id == user_id
    ).all()

    return records