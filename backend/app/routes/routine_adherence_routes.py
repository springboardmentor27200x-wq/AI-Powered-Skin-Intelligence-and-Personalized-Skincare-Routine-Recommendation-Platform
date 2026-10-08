from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User, SkincareRoutine, RoutineAdherence


router = APIRouter(
    prefix="/api/routine-adherence",
    tags=["Routine Adherence"],
)


# =========================================================
# GET TODAY'S ROUTINE ADHERENCE
# =========================================================

@router.get("/{user_id}")
def get_routine_adherence(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own routine adherence.",
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Routine adherence access denied.",
        )

    # -----------------------------------------------------
    # CHECK USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(User.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found.",
        )

    # -----------------------------------------------------
    # TODAY
    # -----------------------------------------------------

    today = date.today()

    # -----------------------------------------------------
    # GET TODAY'S RECORDS
    # -----------------------------------------------------

    records = (
        db.query(RoutineAdherence)
        .filter(
            RoutineAdherence.user_id == user_id,
            RoutineAdherence.date == today,
        )
        .all()
    )

    # -----------------------------------------------------
    # CALCULATE ADHERENCE
    # -----------------------------------------------------

    total_activities = len(records)

    completed_activities = sum(
        1
        for record in records
        if bool(record.completed)
    )

    if total_activities > 0:
        adherence_percentage = round(
            (
                completed_activities
                / total_activities
            )
            * 100,
            2,
        )
    else:
        adherence_percentage = 0

    # -----------------------------------------------------
    # RETURN RESPONSE
    # -----------------------------------------------------

    return {
        "user_id": user_id,
        "date": today,
        "total_activities": total_activities,
        "completed_activities": completed_activities,
        "adherence_percentage": adherence_percentage,
        "records": [
            {
                "id": record.id,
                "routine_id": record.routine_id,
                "routine_type": record.routine_type,
                "activity": record.activity,
                "completed": bool(record.completed),
                "date": record.date,
            }
            for record in records
        ],
    }


# =========================================================
# RECORD ROUTINE COMPLETION
# =========================================================

@router.post("/{user_id}")
def record_routine_adherence(
    user_id: int,
    routine_id: int,
    routine_type: str,
    activity: str,
    completed: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own routine adherence.",
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Routine adherence access denied.",
        )

    # -----------------------------------------------------
    # CHECK ROUTINE
    # -----------------------------------------------------

    routine = (
        db.query(SkincareRoutine)
        .filter(
            SkincareRoutine.id == routine_id,
            SkincareRoutine.user_id == user_id,
        )
        .first()
    )

    if not routine:
        raise HTTPException(
            status_code=404,
            detail="Skincare routine not found.",
        )

    # -----------------------------------------------------
    # TODAY
    # -----------------------------------------------------

    today = date.today()

    # -----------------------------------------------------
    # CHECK EXISTING RECORD
    # -----------------------------------------------------

    existing_record = (
        db.query(RoutineAdherence)
        .filter(
            RoutineAdherence.user_id == user_id,
            RoutineAdherence.routine_id == routine_id,
            RoutineAdherence.routine_type == routine_type,
            RoutineAdherence.activity == activity,
            RoutineAdherence.date == today,
        )
        .first()
    )

    # -----------------------------------------------------
    # UPDATE EXISTING RECORD
    # -----------------------------------------------------

    if existing_record:

        existing_record.completed = (
            1 if completed else 0
        )

        db.commit()
        db.refresh(existing_record)

        record = existing_record

    # -----------------------------------------------------
    # CREATE NEW RECORD
    # -----------------------------------------------------

    else:

        new_record = RoutineAdherence(
            user_id=user_id,
            routine_id=routine_id,
            routine_type=routine_type,
            activity=activity,
            completed=1 if completed else 0,
            date=today,
        )

        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        record = new_record

    # -----------------------------------------------------
    # RETURN
    # -----------------------------------------------------

    return {
        "message": "Routine adherence recorded successfully.",
        "record": {
            "id": record.id,
            "routine_id": record.routine_id,
            "routine_type": record.routine_type,
            "activity": record.activity,
            "completed": bool(record.completed),
            "date": record.date,
        },
    }


# =========================================================
# UPDATE ROUTINE ADHERENCE RECORD
# =========================================================

@router.put("/{user_id}/{record_id}")
def update_routine_adherence(
    user_id: int,
    record_id: int,
    completed: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only update your own routine adherence.",
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Routine adherence access denied.",
        )

    # -----------------------------------------------------
    # FIND RECORD
    # -----------------------------------------------------

    record = (
        db.query(RoutineAdherence)
        .filter(
            RoutineAdherence.id == record_id,
            RoutineAdherence.user_id == user_id,
        )
        .first()
    )

    if not record:
        raise HTTPException(
            status_code=404,
            detail="Routine adherence record not found.",
        )

    # -----------------------------------------------------
    # UPDATE
    # -----------------------------------------------------

    record.completed = 1 if completed else 0

    db.commit()
    db.refresh(record)

    return {
        "message": "Routine adherence updated successfully.",
        "record": {
            "id": record.id,
            "routine_id": record.routine_id,
            "routine_type": record.routine_type,
            "activity": record.activity,
            "completed": bool(record.completed),
            "date": record.date,
        },
    }


# =========================================================
# ADHERENCE SUMMARY
# =========================================================

@router.get("/{user_id}/summary")
def get_routine_adherence_summary(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # SECURITY
    # -----------------------------------------------------

    if current_user.role == "user":

        if current_user.id != user_id:
            raise HTTPException(
                status_code=403,
                detail="You can only access your own routine adherence.",
            )

    elif current_user.role not in [
        "consultant",
        "dermatologist",
        "admin",
    ]:
        raise HTTPException(
            status_code=403,
            detail="Routine adherence access denied.",
        )

    # -----------------------------------------------------
    # GET ALL RECORDS
    # -----------------------------------------------------

    records = (
        db.query(RoutineAdherence)
        .filter(
            RoutineAdherence.user_id == user_id
        )
        .all()
    )

    if not records:
        return {
            "user_id": user_id,
            "overall_adherence": 0,
            "morning_adherence": 0,
            "evening_adherence": 0,
            "weekly_adherence": 0,
            "total_records": 0,
        }

    # -----------------------------------------------------
    # CALCULATE OVERALL
    # -----------------------------------------------------

    total = len(records)

    completed = sum(
        1
        for record in records
        if bool(record.completed)
    )

    overall_adherence = round(
        (completed / total) * 100,
        2,
    )

    # -----------------------------------------------------
    # MORNING
    # -----------------------------------------------------

    morning_records = [
        record
        for record in records
        if record.routine_type == "morning"
    ]

    morning_adherence = (
        round(
            sum(
                1
                for record in morning_records
                if bool(record.completed)
            )
            / len(morning_records)
            * 100,
            2,
        )
        if morning_records
        else 0
    )

    # -----------------------------------------------------
    # EVENING
    # -----------------------------------------------------

    evening_records = [
        record
        for record in records
        if record.routine_type == "evening"
    ]

    evening_adherence = (
        round(
            sum(
                1
                for record in evening_records
                if bool(record.completed)
            )
            / len(evening_records)
            * 100,
            2,
        )
        if evening_records
        else 0
    )

    # -----------------------------------------------------
    # WEEKLY
    # -----------------------------------------------------

    weekly_records = [
        record
        for record in records
        if record.routine_type == "weekly"
    ]

    weekly_adherence = (
        round(
            sum(
                1
                for record in weekly_records
                if bool(record.completed)
            )
            / len(weekly_records)
            * 100,
            2,
        )
        if weekly_records
        else 0
    )

    return {
        "user_id": user_id,
        "overall_adherence": overall_adherence,
        "morning_adherence": morning_adherence,
        "evening_adherence": evening_adherence,
        "weekly_adherence": weekly_adherence,
        "total_records": total,
    }