"""
Notifications & Reminder System — Milestone 4
Endpoints:
  GET  /api/notifications              — list current user's notifications
  PUT  /api/notifications/{id}/read    — mark one as read
  PUT  /api/notifications/read-all     — mark all as read
  POST /api/notifications/generate     — generate daily reminders for current user
  POST /api/notifications/send         — send notification to a specific user (admin/consultant/dermatologist)
  POST /api/notifications/broadcast    — send notification to all users (admin only)
  DELETE /api/notifications/{id}       — delete a notification
"""
import json
import random
from datetime import datetime, date, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from database import get_db
from auth import get_current_user
from rbac import require_role
from models import User, Notification, SkincareRoutine, RoutineChecklistLog, HydrationLog, SleepLog

router = APIRouter()



# ────────────────────────── Schemas ──────────────────────────

class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListOut(BaseModel):
    notifications: List[NotificationOut]
    unread_count: int


class SendNotificationIn(BaseModel):
    user_id: int
    title: str
    message: str
    notification_type: str = "system"


class BroadcastNotificationIn(BaseModel):
    title: str
    message: str
    notification_type: str = "system"


class UserContactOut(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    role: str

    class Config:
        from_attributes = True


# ────────────────────────── Helpers ──────────────────────────

def _create_notif(db: Session, user_id: int, title: str, message: str, ntype: str):
    n = Notification(user_id=user_id, title=title, message=message, notification_type=ntype)
    db.add(n)


# ────────────────────────── Routes ──────────────────────────

@router.get("", response_model=NotificationListOut)
def list_notifications(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notifs = (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )
    unread = sum(1 for n in notifs if not n.is_read)
    return {"notifications": notifs, "unread_count": unread}


@router.put("/read-all")
def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False,
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.put("/{notif_id}/read")
def mark_read(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.delete("/{notif_id}")
def delete_notification(
    notif_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    return {"message": "Notification deleted"}


@router.post("/generate")
def generate_daily_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generates contextual reminders based on current user's data:
    - Routine reminder if no checklist completed today
    - Hydration reminder if water intake below target
    - Sleep reminder if recent poor sleep quality logged
    Always creates a daily motivational system notification.
    """
    today = date.today()
    generated = []

    # ── 1. Routine reminder ──────────────────────────────────
    checklist_today = db.query(RoutineChecklistLog).filter(
        RoutineChecklistLog.user_id == current_user.id,
        RoutineChecklistLog.log_date == today,
    ).first()
    if not checklist_today:
        _create_notif(
            db, current_user.id,
            "🌿 Daily Routine Reminder",
            "Don't forget your skincare routine today! Consistency is key to healthy skin.",
            "routine_reminder",
        )
        generated.append("routine_reminder")

    # ── 2. Hydration reminder ────────────────────────────────
    hydration_today = db.query(HydrationLog).filter(
        HydrationLog.user_id == current_user.id,
        HydrationLog.log_date == today,
    ).first()
    if not hydration_today or hydration_today.glasses_of_water < 6:
        current_glasses = hydration_today.glasses_of_water if hydration_today else 0
        _create_notif(
            db, current_user.id,
            "💧 Hydration Reminder",
            f"You've logged {current_glasses} glasses of water today. Aim for at least 8 glasses for optimal skin hydration!",
            "hydration_reminder",
        )
        generated.append("hydration_reminder")

    # ── 3. Sleep reminder ────────────────────────────────────
    recent_sleep = (
        db.query(SleepLog)
        .filter(SleepLog.user_id == current_user.id)
        .order_by(SleepLog.log_date.desc())
        .first()
    )
    if recent_sleep and recent_sleep.sleep_quality <= 4:
        _create_notif(
            db, current_user.id,
            "😴 Sleep Quality Alert",
            f"Your recent sleep quality was rated {recent_sleep.sleep_quality}/10. Poor sleep accelerates skin aging — try to get 7-9 hours tonight.",
            "sleep_reminder",
        )
        generated.append("sleep_reminder")

    # ── 4. Daily motivation ──────────────────────────────────
    tips = [
        "Apply sunscreen every morning — UV protection is the #1 anti-aging step!",
        "Vitamin C serum in the morning boosts collagen and fights free radicals.",
        "Always patch-test new products before applying to your full face.",
        "Retinol works best at night — start with 2x per week to build tolerance.",
        "Niacinamide reduces pores and controls oil — great for combination skin.",
    ]
    _create_notif(
        db, current_user.id,
        "✨ Daily Skin Tip",
        random.choice(tips),
        "system",
    )
    generated.append("system")

    db.commit()
    return {
        "message": f"Generated {len(generated)} notifications",
        "types_generated": generated,
    }


# ────────────────────── Send Notifications ──────────────────────


@router.get("/users", response_model=List[UserContactOut])
def list_users_for_notification(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "skincare_consultant", "dermatologist")),
):
    """List all users with their phone numbers for sending notifications."""
    users = db.query(User).order_by(User.name).all()
    return users


@router.post("/send")
def send_notification_to_user(
    payload: SendNotificationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "skincare_consultant", "dermatologist")),
):
    """Send a notification to a specific user by ID."""
    target = db.query(User).filter(User.id == payload.user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    _create_notif(db, target.id, payload.title, payload.message, payload.notification_type)
    db.commit()

    return {
        "message": f"Notification sent to {target.name}",
        "recipient": {
            "id": target.id,
            "name": target.name,
            "email": target.email,
            "phone": target.phone,
        },
    }


@router.post("/broadcast")
def broadcast_notification(
    payload: BroadcastNotificationIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """Broadcast a notification to all users. Admin only."""
    users = db.query(User).all()
    count = 0
    for u in users:
        _create_notif(db, u.id, payload.title, payload.message, payload.notification_type)
        count += 1
    db.commit()
    return {"message": f"Notification broadcast to {count} users"}
