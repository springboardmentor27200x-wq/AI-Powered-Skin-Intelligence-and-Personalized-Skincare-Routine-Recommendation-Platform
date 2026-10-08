from datetime import date, datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user, require_role
from ..models import (
    User,
    Reminder,
    Notification,
    Lifestyle,
    Sleep,
    DailyCheckin,
)
from ..services.health_insights import generate_health_insights


router = APIRouter(
    prefix="/api/notifications",
    tags=["Notifications & Reminders"],
)


# ============================================================
# SCHEMAS
# ============================================================

class ReminderCreate(BaseModel):
    reminder_type: str
    title: str
    message: str
    reminder_time: Optional[str] = None
    next_due_date: Optional[date] = None
    active: bool = True


class ReminderResponse(BaseModel):
    id: int
    user_id: int
    reminder_type: str
    title: str
    message: str
    reminder_time: Optional[str]
    active: bool
    next_due_date: Optional[date]
    last_triggered_date: Optional[date]
    created_at: str

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    notification_type: str
    title: str
    message: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


class PlatformNotificationCreate(BaseModel):
    title: str
    message: str


# ============================================================
# HELPER
# ============================================================

def check_user_access(current_user: User, user_id: int):
    """
    Users can access only their own notifications/reminders.
    Admins can access any user's data.
    """

    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to access this user's data.",
        )


# ============================================================
# REMINDER APIs
# ============================================================

@router.post(
    "/reminders/{user_id}",
    response_model=ReminderResponse,
)
def create_reminder(
    user_id: int,
    reminder: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a reminder for a user.

    Admin can create reminders for any user.
    Normal users can create reminders only for themselves.
    """

    check_user_access(current_user, user_id)

    new_reminder = Reminder(
        user_id=user_id,
        reminder_type=reminder.reminder_type,
        title=reminder.title,
        message=reminder.message,
        reminder_time=reminder.reminder_time,
        active=reminder.active,
        next_due_date=reminder.next_due_date,
        created_at=datetime.now().isoformat(),
    )

    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)

    return new_reminder


@router.get(
    "/reminders/{user_id}",
    response_model=list[ReminderResponse],
)
def get_user_reminders(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get reminders belonging to a user.
    """

    check_user_access(current_user, user_id)

    return (
        db.query(Reminder)
        .filter(Reminder.user_id == user_id)
        .order_by(Reminder.id.desc())
        .all()
    )


@router.delete("/reminders/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a reminder.
    """

    reminder = (
        db.query(Reminder)
        .filter(Reminder.id == reminder_id)
        .first()
    )

    if not reminder:
        raise HTTPException(
            status_code=404,
            detail="Reminder not found.",
        )

    check_user_access(current_user, reminder.user_id)

    db.delete(reminder)
    db.commit()

    return {
        "message": "Reminder deleted successfully."
    }


# ============================================================
# GENERATE NOTIFICATIONS FROM REMINDERS
# ============================================================

@router.post(
    "/generate/{user_id}",
    response_model=list[NotificationResponse],
)
def generate_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate notifications for due reminders.
    """

    check_user_access(current_user, user_id)

    today = date.today()

    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.active == True,
        )
        .all()
    )

    generated_notifications = []

    for reminder in reminders:

        should_trigger = False

        # Date based reminder
        if reminder.next_due_date is not None:

            if reminder.next_due_date <= today:
                should_trigger = True

        # Daily reminder
        elif reminder.reminder_time:

            if reminder.last_triggered_date != today:
                should_trigger = True

        if should_trigger:

            notification = Notification(
                user_id=user_id,
                notification_type=reminder.reminder_type,
                title=reminder.title,
                message=reminder.message,
                is_read=False,
                created_at=datetime.now().isoformat(),
            )

            db.add(notification)

            reminder.last_triggered_date = today

            if reminder.next_due_date is not None:
                reminder.active = False

            generated_notifications.append(notification)

    db.commit()

    for notification in generated_notifications:
        db.refresh(notification)

    return generated_notifications


# ============================================================
# AUTOMATIC HYDRATION NOTIFICATION
# ============================================================

@router.post(
    "/auto/hydration/{user_id}",
    response_model=NotificationResponse,
)
def generate_hydration_notification(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Automatically check the user's latest water intake.
    """

    check_user_access(current_user, user_id)

    today = date.today()

    lifestyle = (
        db.query(Lifestyle)
        .filter(Lifestyle.user_id == user_id)
        .order_by(Lifestyle.id.desc())
        .first()
    )

    if not lifestyle:
        raise HTTPException(
            status_code=404,
            detail="No lifestyle record found for this user.",
        )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.notification_type == "hydration",
            Notification.created_at.like(f"{today.isoformat()}%"),
        )
        .first()
    )

    if existing_notification:
        return existing_notification

    hydration_target = 2.5
    low_hydration_limit = 2.0

    water_intake = lifestyle.water_intake or 0

    if water_intake < low_hydration_limit:

        notification = Notification(
            user_id=user_id,
            notification_type="hydration",
            title="💧 Hydration Reminder",
            message=(
                f"Your current water intake is {water_intake} L. "
                f"Try to reach around {hydration_target} L today "
                f"to stay well hydrated."
            ),
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

    else:

        notification = Notification(
            user_id=user_id,
            notification_type="hydration",
            title="💧 Hydration Goal On Track",
            message=(
                f"Great! Your current water intake is {water_intake} L. "
                f"Keep working toward {hydration_target} L today."
            ),
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# AUTOMATIC SLEEP NOTIFICATION
# ============================================================

@router.post(
    "/auto/sleep/{user_id}",
    response_model=NotificationResponse,
)
def generate_sleep_notification(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Automatically check the user's latest sleep record.
    """

    check_user_access(current_user, user_id)

    today = date.today()

    sleep_record = (
        db.query(Sleep)
        .filter(Sleep.user_id == user_id)
        .order_by(Sleep.id.desc())
        .first()
    )

    if not sleep_record:
        raise HTTPException(
            status_code=404,
            detail="No sleep record found for this user.",
        )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.notification_type == "sleep",
            Notification.created_at.like(f"{today.isoformat()}%"),
        )
        .first()
    )

    if existing_notification:
        return existing_notification

    sleep_hours = sleep_record.sleep_hours or 0
    recommended_sleep = 7.0

    if sleep_hours < recommended_sleep:

        notification = Notification(
            user_id=user_id,
            notification_type="sleep",
            title="😴 Sleep Reminder",
            message=(
                f"Your recent sleep duration is {sleep_hours} hours. "
                f"Try to get at least {recommended_sleep} hours of sleep "
                f"for better overall skin and lifestyle health."
            ),
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

    else:

        notification = Notification(
            user_id=user_id,
            notification_type="sleep",
            title="😴 Sleep Goal On Track",
            message=(
                f"Great! Your recent sleep duration is {sleep_hours} hours. "
                f"Keep maintaining a healthy sleep routine."
            ),
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# AUTOMATIC PROGRESS NOTIFICATION
# ============================================================

@router.post(
    "/auto/progress/{user_id}",
    response_model=NotificationResponse,
)
def generate_progress_notification(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Compare the latest two check-ins and generate
    a progress notification.
    """

    check_user_access(current_user, user_id)

    today = date.today()

    checkins = (
        db.query(DailyCheckin)
        .filter(DailyCheckin.user_id == user_id)
        .order_by(DailyCheckin.id.desc())
        .limit(2)
        .all()
    )

    if not checkins:
        raise HTTPException(
            status_code=404,
            detail="No check-in records found for this user.",
        )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.notification_type == "progress",
            Notification.created_at.like(f"{today.isoformat()}%"),
        )
        .first()
    )

    if existing_notification:
        return existing_notification

    latest_score = checkins[0].skin_health_score or 0

    if len(checkins) >= 2:

        previous_score = checkins[1].skin_health_score or 0

        if latest_score > previous_score:

            title = "📈 Skin Progress Improving"

            message = (
                f"Your skin health score increased from "
                f"{previous_score:.1f} to {latest_score:.1f}. "
                f"Keep following your personalized skincare routine."
            )

        elif latest_score < previous_score:

            title = "⚠️ Skin Progress Needs Attention"

            message = (
                f"Your skin health score changed from "
                f"{previous_score:.1f} to {latest_score:.1f}. "
                f"Review your skincare routine, hydration, "
                f"sleep, and lifestyle habits."
            )

        else:

            title = "👍 Skin Progress Stable"

            message = (
                f"Your skin health score is stable at "
                f"{latest_score:.1f}. Continue maintaining "
                f"your healthy habits."
            )

    else:

        title = "📊 Skin Progress Recorded"

        message = (
            f"Your latest skin health score is "
            f"{latest_score:.1f}. Continue tracking "
            f"your progress regularly."
        )

    notification = Notification(
        user_id=user_id,
        notification_type="progress",
        title=title,
        message=message,
        is_read=False,
        created_at=datetime.now().isoformat(),
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# AUTOMATIC PRODUCT REPLENISHMENT NOTIFICATION
# ============================================================

@router.post(
    "/auto/product-replenishment/{user_id}",
    response_model=NotificationResponse,
)
def generate_product_replenishment_notification(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check active product replenishment reminders.
    """

    check_user_access(current_user, user_id)

    today = date.today()

    reminders = (
        db.query(Reminder)
        .filter(
            Reminder.user_id == user_id,
            Reminder.reminder_type == "product_replenishment",
            Reminder.active == True,
            Reminder.next_due_date.isnot(None),
        )
        .all()
    )

    if not reminders:
        raise HTTPException(
            status_code=404,
            detail="No active product replenishment reminders found.",
        )

    existing_notification = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.notification_type == "product_replenishment",
            Notification.created_at.like(f"{today.isoformat()}%"),
        )
        .first()
    )

    if existing_notification:
        return existing_notification

    due_reminder = None

    for reminder in reminders:

        if reminder.next_due_date <= today:
            due_reminder = reminder
            break

    if not due_reminder:

        upcoming_reminder = min(
            reminders,
            key=lambda reminder: reminder.next_due_date,
        )

        days_remaining = (
            upcoming_reminder.next_due_date - today
        ).days

        if days_remaining == 1:

            message = (
                f"{upcoming_reminder.title} is due tomorrow. "
                f"{upcoming_reminder.message}"
            )

        else:

            message = (
                f"{upcoming_reminder.title} is due in "
                f"{days_remaining} days. "
                f"{upcoming_reminder.message}"
            )

        notification = Notification(
            user_id=user_id,
            notification_type="product_replenishment",
            title="🧴 Product Replenishment Reminder",
            message=message,
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

    else:

        notification = Notification(
            user_id=user_id,
            notification_type="product_replenishment",
            title="🧴 Product Replenishment Due",
            message=(
                f"{due_reminder.title} is due for replenishment. "
                f"{due_reminder.message}"
            ),
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

        due_reminder.last_triggered_date = today

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


# ============================================================
# HEALTH INSIGHT NOTIFICATION HELPER
# ============================================================

def create_health_insight_notifications(
    db: Session,
    user_id: int,
):
    """
    Generate notifications from the health-insights service.

    Only high-priority insights create notifications.

    Same-day duplicate notifications are prevented.
    """

    result = generate_health_insights(
        db=db,
        user_id=user_id,
    )

    if not result:
        return []

    insights = result.get("insights", [])

    today_prefix = f"{date.today().isoformat()}%"

    generated_notifications = []

    for insight in insights:

        # Only high-priority insights become notifications
        if insight.get("priority") != "high":
            continue

        category = insight.get(
            "category",
            "Health",
        )

        status_text = insight.get(
            "status",
            "Needs Attention",
        )

        message = insight.get(
            "message",
            "Your health data indicates that some attention may be needed.",
        )

        # Create a stable notification type
        category_key = (
            category.lower()
            .replace(" ", "_")
            .replace("-", "_")
        )

        notification_type = f"health_{category_key}"

        title = f"⚠️ {category}: {status_text}"

        # ----------------------------------------------------
        # SAME-DAY DUPLICATE CHECK
        # ----------------------------------------------------

        existing_notification = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.notification_type == notification_type,
                Notification.created_at.like(today_prefix),
            )
            .first()
        )

        if existing_notification:
            continue

        # ----------------------------------------------------
        # CREATE NOTIFICATION
        # ----------------------------------------------------

        notification = Notification(
            user_id=user_id,
            notification_type=notification_type,
            title=title,
            message=message,
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

        db.add(notification)

        generated_notifications.append(notification)

    if generated_notifications:
        db.commit()

        for notification in generated_notifications:
            db.refresh(notification)

    return generated_notifications


# ============================================================
# AUTOMATIC HEALTH INSIGHTS NOTIFICATION
# ============================================================

@router.post(
    "/auto/health-insights/{user_id}",
    response_model=list[NotificationResponse],
)
def generate_health_insight_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate notifications from high-priority personalized
    health insights.
    """

    check_user_access(current_user, user_id)

    notifications = create_health_insight_notifications(
        db=db,
        user_id=user_id,
    )

    return notifications


# ============================================================
# GENERATE ALL AUTOMATIC NOTIFICATIONS
# ============================================================

@router.post(
    "/auto/generate-all/{user_id}",
    response_model=list[NotificationResponse],
)
def generate_all_automatic_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate all applicable automatic notifications.

    Notification types:
    - hydration
    - sleep
    - progress
    - product_replenishment
    - health insights

    Duplicate notifications are prevented on the same day.
    """

    check_user_access(current_user, user_id)

    today = date.today()
    today_prefix = f"{today.isoformat()}%"

    generated_notifications = []

    # =====================================================
    # HELPER
    # =====================================================

    def already_created(notification_type: str) -> bool:
        return (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.notification_type == notification_type,
                Notification.created_at.like(today_prefix),
            )
            .first()
            is not None
        )

    # =====================================================
    # 1. HYDRATION
    # =====================================================

    if not already_created("hydration"):

        lifestyle = (
            db.query(Lifestyle)
            .filter(Lifestyle.user_id == user_id)
            .order_by(Lifestyle.id.desc())
            .first()
        )

        if lifestyle:

            water_intake = lifestyle.water_intake or 0

            if water_intake < 2.0:

                notification = Notification(
                    user_id=user_id,
                    notification_type="hydration",
                    title="💧 Hydration Reminder",
                    message=(
                        f"Your current water intake is "
                        f"{water_intake} L. Try to increase "
                        f"your water intake and stay well hydrated."
                    ),
                    is_read=False,
                    created_at=datetime.now().isoformat(),
                )

                db.add(notification)
                generated_notifications.append(notification)

    # =====================================================
    # 2. SLEEP
    # =====================================================

    if not already_created("sleep"):

        sleep_record = (
            db.query(Sleep)
            .filter(Sleep.user_id == user_id)
            .order_by(Sleep.id.desc())
            .first()
        )

        if sleep_record:

            sleep_hours = sleep_record.sleep_hours or 0

            if sleep_hours < 7.0:

                notification = Notification(
                    user_id=user_id,
                    notification_type="sleep",
                    title="😴 Sleep Reminder",
                    message=(
                        f"Your recent sleep duration is "
                        f"{sleep_hours} hours. Try to get at least "
                        f"7 hours of sleep."
                    ),
                    is_read=False,
                    created_at=datetime.now().isoformat(),
                )

                db.add(notification)
                generated_notifications.append(notification)

    # =====================================================
    # 3. PROGRESS
    # =====================================================

    if not already_created("progress"):

        checkins = (
            db.query(DailyCheckin)
            .filter(DailyCheckin.user_id == user_id)
            .order_by(DailyCheckin.id.desc())
            .limit(2)
            .all()
        )

        if len(checkins) >= 2:

            latest_score = checkins[0].skin_health_score or 0
            previous_score = checkins[1].skin_health_score or 0

            if latest_score > previous_score:

                progress_title = "📈 Skin Progress Improving"

                progress_message = (
                    f"Your skin health score increased from "
                    f"{previous_score:.1f} to {latest_score:.1f}. "
                    f"Keep following your skincare routine."
                )

            elif latest_score < previous_score:

                progress_title = "⚠️ Skin Progress Needs Attention"

                progress_message = (
                    f"Your skin health score changed from "
                    f"{previous_score:.1f} to {latest_score:.1f}. "
                    f"Review your skincare and lifestyle habits."
                )

            else:

                progress_title = "👍 Skin Progress Stable"

                progress_message = (
                    f"Your skin health score remains at "
                    f"{latest_score:.1f}. Keep maintaining "
                    f"your healthy habits."
                )

            notification = Notification(
                user_id=user_id,
                notification_type="progress",
                title=progress_title,
                message=progress_message,
                is_read=False,
                created_at=datetime.now().isoformat(),
            )

            db.add(notification)
            generated_notifications.append(notification)

    # =====================================================
    # 4. PRODUCT REPLENISHMENT
    # =====================================================

    if not already_created("product_replenishment"):

        reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user_id,
                Reminder.reminder_type == "product_replenishment",
                Reminder.active == True,
                Reminder.next_due_date.isnot(None),
            )
            .all()
        )

        for reminder in reminders:

            if reminder.next_due_date <= today:

                notification = Notification(
                    user_id=user_id,
                    notification_type="product_replenishment",
                    title="🧴 Product Replenishment Due",
                    message=(
                        f"{reminder.title} is due for replenishment. "
                        f"{reminder.message}"
                    ),
                    is_read=False,
                    created_at=datetime.now().isoformat(),
                )

                db.add(notification)
                generated_notifications.append(notification)

                reminder.last_triggered_date = today

                break

    # =====================================================
    # 5. HEALTH INSIGHTS
    # =====================================================

    health_notifications = create_health_insight_notifications(
        db=db,
        user_id=user_id,
    )

    generated_notifications.extend(
        health_notifications
    )

    # =====================================================
    # SAVE
    # =====================================================

    db.commit()

    for notification in generated_notifications:
        db.refresh(notification)

    return generated_notifications


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get(
    "/{user_id}",
    response_model=list[NotificationResponse],
)
def get_notifications(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get notifications for a user.
    """

    check_user_access(current_user, user_id)

    return (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(Notification.id.desc())
        .all()
    )


# ============================================================
# MARK ONE NOTIFICATION AS READ
# ============================================================

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark one notification as read.
    """

    notification = (
        db.query(Notification)
        .filter(Notification.id == notification_id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=404,
            detail="Notification not found.",
        )

    check_user_access(
        current_user,
        notification.user_id,
    )

    notification.is_read = True

    db.commit()

    return {
        "message": "Notification marked as read."
    }


# ============================================================
# MARK ALL NOTIFICATIONS AS READ
# ============================================================

@router.put("/{user_id}/read-all")
def mark_all_notifications_read(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark all notifications of a user as read.
    """

    check_user_access(current_user, user_id)

    notifications = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.is_read == False,
        )
        .all()
    )

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {
        "message": "All notifications marked as read.",
        "updated_count": len(notifications),
    }


# ============================================================
# ADMIN PLATFORM NOTIFICATION
# ============================================================

@router.post(
    "/platform",
    response_model=dict,
)
def create_platform_notification(
    notification_data: PlatformNotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    """
    Admin-only platform notification.

    This sends a notification to every registered user.
    """

    users = db.query(User).all()

    created_count = 0

    for user in users:

        notification = Notification(
            user_id=user.id,
            notification_type="platform",
            title=notification_data.title,
            message=notification_data.message,
            is_read=False,
            created_at=datetime.now().isoformat(),
        )

        db.add(notification)

        created_count += 1

    db.commit()

    return {
        "message": "Platform notification created successfully.",
        "users_notified": created_count,
    }