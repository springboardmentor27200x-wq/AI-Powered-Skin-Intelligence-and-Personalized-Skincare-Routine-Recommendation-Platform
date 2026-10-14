from datetime import date as date_type

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.sleep_record import SleepRecord
from app.models.lifestyle_record import LifestyleRecord
from app.models.hydration_record import HydrationRecord
from app.models.environmental_exposure_record import EnvironmentalExposureRecord
from app.schemas.daily_log import DailyLogIn, DailyLogOut

router = APIRouter(prefix="/daily-logs", tags=["daily-logs"])


def _get_or_create(model, db: Session, user_id, log_date):
    entry = db.query(model).filter(model.user_id == user_id, model.log_date == log_date).first()
    if entry is None:
        entry = model(user_id=user_id, log_date=log_date)
        db.add(entry)
    return entry


def _merge_to_out(log_date, sleep, lifestyle, hydration, environmental) -> DailyLogOut:
    # lifestyle_records is the canonical row for id/timestamps — every
    # save always writes one, so it's always present.
    anchor = lifestyle or sleep or hydration or environmental
    return DailyLogOut(
        id=anchor.id,
        user_id=anchor.user_id,
        log_date=log_date,
        sleep_quality=sleep.sleep_quality if sleep else None,
        sleep_hours=sleep.sleep_hours if sleep else None,
        water_intake_liters=hydration.water_intake_liters if hydration else None,
        activity_level=lifestyle.activity_level if lifestyle else None,
        stress_level=lifestyle.stress_level if lifestyle else None,
        diet_notes=lifestyle.diet_notes if lifestyle else None,
        lifestyle_habits=lifestyle.lifestyle_habits if lifestyle else None,
        environmental_exposure=environmental.environmental_exposure if environmental else None,
        notes=lifestyle.notes if lifestyle else None,
        created_at=anchor.created_at,
        updated_at=anchor.updated_at,
    )


@router.get("", response_model=list[DailyLogOut])
def list_my_logs(
    limit: int = Query(default=30, ge=1, le=365),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Merges the four normalized tables back into one row per day, in
    the same shape the frontend has always received."""
    dates = sorted(
        {
            *(d for (d,) in db.query(SleepRecord.log_date).filter(SleepRecord.user_id == current_user.id)),
            *(d for (d,) in db.query(LifestyleRecord.log_date).filter(LifestyleRecord.user_id == current_user.id)),
            *(d for (d,) in db.query(HydrationRecord.log_date).filter(HydrationRecord.user_id == current_user.id)),
            *(d for (d,) in db.query(EnvironmentalExposureRecord.log_date).filter(EnvironmentalExposureRecord.user_id == current_user.id)),
        },
        reverse=True,
    )[:limit]

    results = []
    for d in dates:
        sleep = db.query(SleepRecord).filter(SleepRecord.user_id == current_user.id, SleepRecord.log_date == d).first()
        lifestyle = db.query(LifestyleRecord).filter(LifestyleRecord.user_id == current_user.id, LifestyleRecord.log_date == d).first()
        hydration = db.query(HydrationRecord).filter(HydrationRecord.user_id == current_user.id, HydrationRecord.log_date == d).first()
        environmental = db.query(EnvironmentalExposureRecord).filter(EnvironmentalExposureRecord.user_id == current_user.id, EnvironmentalExposureRecord.log_date == d).first()
        results.append(_merge_to_out(d, sleep, lifestyle, hydration, environmental))
    return results


@router.put("", response_model=DailyLogOut)
def upsert_log_for_date(
    payload: DailyLogIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """One entry per user per date, per table — saving the same date
    again updates all four records in a single transaction."""
    sleep = _get_or_create(SleepRecord, db, current_user.id, payload.log_date)
    sleep.sleep_quality = payload.sleep_quality
    sleep.sleep_hours = payload.sleep_hours

    lifestyle = _get_or_create(LifestyleRecord, db, current_user.id, payload.log_date)
    lifestyle.activity_level = payload.activity_level
    lifestyle.stress_level = payload.stress_level
    lifestyle.diet_notes = payload.diet_notes
    lifestyle.lifestyle_habits = payload.lifestyle_habits
    lifestyle.notes = payload.notes

    hydration = _get_or_create(HydrationRecord, db, current_user.id, payload.log_date)
    hydration.water_intake_liters = payload.water_intake_liters

    environmental = _get_or_create(EnvironmentalExposureRecord, db, current_user.id, payload.log_date)
    environmental.environmental_exposure = payload.environmental_exposure

    db.commit()
    db.refresh(sleep)
    db.refresh(lifestyle)
    db.refresh(hydration)
    db.refresh(environmental)

    return _merge_to_out(payload.log_date, sleep, lifestyle, hydration, environmental)


@router.delete("/{log_date}", status_code=status.HTTP_204_NO_CONTENT)
def delete_log(
    log_date: date_type,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Deletes all four records for that date. Note: this now takes the
    date itself (e.g. 2026-08-29), not a row id — a day's entry is split
    across four tables with four different ids now."""
    found = False
    for model in (SleepRecord, LifestyleRecord, HydrationRecord, EnvironmentalExposureRecord):
        entry = db.query(model).filter(model.user_id == current_user.id, model.log_date == log_date).first()
        if entry:
            db.delete(entry)
            found = True

    if not found:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No log entry for that date")

    db.commit()