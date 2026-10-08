import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.notification import (
    NotificationListResponse,
    NotificationResponse,
    UnreadCountResponse,
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
)
from app.services import notification_service

router = APIRouter()


import logging

logger = logging.getLogger(__name__)

@router.get("", response_model=NotificationListResponse, summary="Get user notifications")
def get_notifications(
    category: Optional[str] = Query(None, description="ROUTINE, REPLENISHMENT, HYDRATION, SLEEP, PROGRESS, PLATFORM"),
    unread_only: bool = Query(False, description="Filter only unread notifications"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns user notifications with unread count.
    Automatically runs proactive reminder sync for the user.
    """
    try:
        notification_service.sync_reminders(db, current_user)
    except Exception as e:
        db.rollback()
        logger.warning(f"Reminder sync error in get_notifications: {e}")

    user_id = uuid.UUID(str(current_user.id))
    try:
        data = notification_service.get_notifications(
            db=db,
            user_id=user_id,
            category=category,
            unread_only=unread_only,
            limit=limit,
            offset=offset,
        )
        return data
    except Exception as e:
        db.rollback()
        logger.error(f"Error fetching notifications for user {user_id}: {e}")
        return {"notifications": [], "total": 0, "unread_count": 0}


@router.get("/unread-count", response_model=UnreadCountResponse, summary="Get unread notifications count")
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = uuid.UUID(str(current_user.id))
    count = notification_service.get_unread_count(db, user_id)
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse, summary="Mark notification as read")
def mark_as_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = uuid.UUID(str(current_user.id))
    notif = notification_service.mark_as_read(db, notification_id, user_id)
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )
    return notif


@router.put("/read-all", summary="Mark all user notifications as read")
def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = uuid.UUID(str(current_user.id))
    count = notification_service.mark_all_as_read(db, user_id)
    return {"marked_count": count}


@router.get("/preferences", response_model=NotificationPreferenceResponse, summary="Get notification preferences")
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = uuid.UUID(str(current_user.id))
    return notification_service.get_preferences(db, user_id)


@router.put("/preferences", response_model=NotificationPreferenceResponse, summary="Update notification preferences")
def update_preferences(
    updates: NotificationPreferenceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = uuid.UUID(str(current_user.id))
    return notification_service.update_preferences(db, user_id, updates.model_dump(exclude_unset=True))


@router.post("/sync", summary="Trigger reminder generation check")
def trigger_sync(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    new_notifs = notification_service.sync_reminders(db, current_user)
    return {"generated": len(new_notifs)}
