import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user, require_roles
from app.models.announcement import PlatformAnnouncement
from app.models.hydration_record import HydrationRecord
from app.models.product import Product
from app.models.routine import Routine
from app.models.routine_adherence import RoutineAdherenceLog
from app.models.skin_assessment import SkinAssessment
from app.models.sleep_record import SleepRecord
from app.models.user import User, UserRole
from app.models.user_product import UserProduct
from app.schemas.notification import AnnouncementIn, AnnouncementOut, NotificationOut
from app.services.notification_engine import build_user_notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])

require_admin = require_roles(UserRole.administrator)

MAX_ANNOUNCEMENTS_SHOWN = 5      # what the bell shows
MAX_ANNOUNCEMENTS_HISTORY = 50   # what the full Notifications page shows


@router.get("/me", response_model=list[NotificationOut])
def my_notifications(
    announcement_limit: int = Query(default=MAX_ANNOUNCEMENTS_SHOWN, ge=1, le=MAX_ANNOUNCEMENTS_HISTORY),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Everything that needs this user's attention right now.

    Admin announcements go to everyone. Personal reminders (routine, water, sleep,
    progress, product restocking) are computed live from today's data, and only apply to the "user" role.
    """
    notifications: list[dict] = []

    announcements = (
        db.query(PlatformAnnouncement)
        .order_by(PlatformAnnouncement.created_at.desc())
        .limit(announcement_limit)
        .all()
    )
    for a in announcements:
        notifications.append({
            "id": f"platform-{a.id}",
            "type": "platform",
            "severity": "info",
            "title": a.title,
            "message": a.message,
            "action_path": None,
            "created_at": a.created_at,
        })

    if current_user.role == UserRole.user:
        today = date.today()
        uid = current_user.id

        has_routine = db.query(Routine.id).filter(Routine.user_id == uid).first() is not None

        adherence_today = (
            db.query(RoutineAdherenceLog)
            .filter(RoutineAdherenceLog.user_id == uid, RoutineAdherenceLog.log_date == today)
            .first()
        )

        hydration_row = (
            db.query(HydrationRecord.water_intake_liters)
            .filter(HydrationRecord.user_id == uid, HydrationRecord.log_date == today)
            .first()
        )
        hydration_today = float(hydration_row[0]) if hydration_row and hydration_row[0] is not None else None

        sleep_logged_today = (
            db.query(SleepRecord.id)
            .filter(SleepRecord.user_id == uid, SleepRecord.log_date == today)
            .first()
            is not None
        )

        recent_sleep = (
            db.query(SleepRecord.sleep_hours)
            .filter(
                SleepRecord.user_id == uid,
                SleepRecord.log_date >= today - timedelta(days=2),  # today + the 2 days before
                SleepRecord.sleep_hours.isnot(None),
            )
            .all()
        )

        # Only the two columns the engine needs — no need to load the array columns.
        assessments = (
            db.query(SkinAssessment.score, SkinAssessment.created_at)
            .filter(SkinAssessment.user_id == uid)
            .order_by(SkinAssessment.created_at.desc())
            .limit(2)
            .all()
        )

        products_in_use = (
            db.query(UserProduct.product_id, UserProduct.started_on, UserProduct.lasts_days, Product.name)
            .join(Product, Product.id == UserProduct.product_id)
            .filter(UserProduct.user_id == uid)
            .all()
        )

        notifications += build_user_notifications(
            today=today,
            has_routine=has_routine,
            adherence_today=adherence_today,
            hydration_liters_today=hydration_today,
            sleep_logged_today=sleep_logged_today,
            recent_sleep_hours=[float(row[0]) for row in recent_sleep],
            assessments_newest_first=assessments,
            products_in_use=products_in_use,
        )

    return notifications


# ---- Administrator: manage announcements ----

@router.get("/announcements", response_model=list[AnnouncementOut])
def list_announcements(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    return db.query(PlatformAnnouncement).order_by(PlatformAnnouncement.created_at.desc()).all()


@router.post("/announcements", response_model=AnnouncementOut, status_code=status.HTTP_201_CREATED)
def create_announcement(
    payload: AnnouncementIn,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    announcement = PlatformAnnouncement(title=payload.title, message=payload.message, created_by=admin.id)
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement


@router.delete("/announcements/{announcement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_announcement(
    announcement_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    announcement = db.get(PlatformAnnouncement, announcement_id)
    if not announcement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Announcement not found")
    db.delete(announcement)
    db.commit()