"""
DermaIQ Notification Service
Generates, stores, and manages user notifications and reminder preferences.
"""
from __future__ import annotations
import uuid
import logging
from datetime import datetime, timedelta, date
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification, NotificationPreference, NotificationCategory, NotificationPriority
from app.models.user import User
from app.models.routine import Routine
from app.models.hydration import HydrationRecord
from app.models.sleep import SleepRecord
from app.models.progress import ProgressSnapshot

logger = logging.getLogger(__name__)

def _get_or_create_preference(db: Session, user_id: uuid.UUID) -> Optional[NotificationPreference]:
    pref = db.query(NotificationPreference).filter_by(user_id=user_id).first()
    if not pref:
        try:
            pref = NotificationPreference(user_id=user_id)
            db.add(pref)
            db.commit()
            db.refresh(pref)
        except Exception as e:
            db.rollback()
            logger.info(f"Notification preference creation race resolved for user {user_id}: {e}")
            pref = db.query(NotificationPreference).filter_by(user_id=user_id).first()
    return pref

def _create_notification(
    db: Session,
    user_id: uuid.UUID,
    category: NotificationCategory,
    title: str,
    message: str,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    action_url: Optional[str] = None
) -> Optional[Notification]:
    try:
        notif = Notification(
            user_id=user_id,
            category=category,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif
    except Exception as e:
        db.rollback()
        logger.warning(f"Failed to create notification: {e}")
        return None

create_notification = _create_notification


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        user_id: uuid.UUID,
        title: str,
        message: str,
        category: NotificationCategory = NotificationCategory.PLATFORM,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        action_url: Optional[str] = None,
    ) -> Notification:
        return _create_notification(
            db=db,
            user_id=user_id,
            category=category,
            title=title,
            message=message,
            priority=priority,
            action_url=action_url,
        )

    @staticmethod
    def get_notifications(db: Session, user_id: uuid.UUID, category: Optional[str] = None, unread_only: bool = False, limit: int = 50, offset: int = 0) -> dict:
        return get_notifications(db, user_id, category, unread_only, limit, offset)

    @staticmethod
    def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
        return get_unread_count(db, user_id)

    @staticmethod
    def mark_as_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
        return mark_as_read(db, notification_id, user_id)

    @staticmethod
    def mark_all_as_read(db: Session, user_id: uuid.UUID) -> int:
        return mark_all_as_read(db, user_id)


def get_notifications(db: Session, user_id: uuid.UUID, category: Optional[str] = None, unread_only: bool = False, limit: int = 50, offset: int = 0) -> dict:
    user = db.query(User).filter(User.id == user_id).first()
    q = db.query(Notification).filter(Notification.user_id == user_id)

    # Segregate: Ensure professionals do not receive consumer personal wellness reminders
    if user and user.role in ("DERMATOLOGIST", "SKINCARE_CONSULTANT", "ADMINISTRATOR"):
        q = q.filter(Notification.category.notin_([
            NotificationCategory.ROUTINE,
            NotificationCategory.HYDRATION,
            NotificationCategory.SLEEP,
        ]))

    if category:
        try:
            q = q.filter(Notification.category == NotificationCategory(category.upper()))
        except ValueError:
            pass
    if unread_only:
        q = q.filter(Notification.is_read == False)
    total = q.count()
    
    unread_q = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False)
    if user and user.role in ("DERMATOLOGIST", "SKINCARE_CONSULTANT", "ADMINISTRATOR"):
        unread_q = unread_q.filter(Notification.category.notin_([
            NotificationCategory.ROUTINE,
            NotificationCategory.HYDRATION,
            NotificationCategory.SLEEP,
        ]))
    unread = unread_q.count()
    items = q.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()
    return {"notifications": items, "total": total, "unread_count": unread}

def get_unread_count(db: Session, user_id: uuid.UUID) -> int:
    user = db.query(User).filter(User.id == user_id).first()
    q = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False)
    if user and user.role in ("DERMATOLOGIST", "SKINCARE_CONSULTANT", "ADMINISTRATOR"):
        q = q.filter(Notification.category.notin_([
            NotificationCategory.ROUTINE,
            NotificationCategory.HYDRATION,
            NotificationCategory.SLEEP,
        ]))
    return q.count()

def mark_as_read(db: Session, notification_id: uuid.UUID, user_id: uuid.UUID) -> Optional[Notification]:
    notif = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == user_id).first()
    if notif:
        notif.is_read = True
        db.commit()
        db.refresh(notif)
    return notif

def mark_all_as_read(db: Session, user_id: uuid.UUID) -> int:
    count = db.query(Notification).filter(Notification.user_id == user_id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return count

def get_preferences(db: Session, user_id: uuid.UUID) -> NotificationPreference:
    return _get_or_create_preference(db, user_id)

def update_preferences(db: Session, user_id: uuid.UUID, updates: dict) -> NotificationPreference:
    pref = _get_or_create_preference(db, user_id)
    for k, v in updates.items():
        if v is not None and hasattr(pref, k):
            setattr(pref, k, v)
    db.commit()
    db.refresh(pref)
    return pref

def sync_reminders(db: Session, user: User) -> List[Notification]:
    new_notifications: List[Notification] = []
    now = datetime.utcnow()
    recent_cutoff = now - timedelta(hours=20)
    user_role = getattr(user, "role", "USER")

    # =========================================================================
    # ROLE 1: DERMATOLOGIST (Medical Care & Patient Referrals)
    # =========================================================================
    if user_role == "DERMATOLOGIST":
        try:
            # 1. Purge stray consumer reminders for this dermatologist
            db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.category.in_([
                    NotificationCategory.ROUTINE,
                    NotificationCategory.HYDRATION,
                    NotificationCategory.SLEEP,
                ])
            ).delete(synchronize_session=False)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Error purging consumer notifs for dermatologist {user.id}: {e}")

        # 2. Check for Pending Patient Cases Awaiting Review
        try:
            from app.models.connection import ProfessionalConnection
            pending_requests = (
                db.query(ProfessionalConnection)
                .filter(
                    ProfessionalConnection.professional_id == user.id,
                    ProfessionalConnection.status == "PENDING",
                    ProfessionalConnection.initiator_id != user.id,
                )
                .all()
            )
            if pending_requests:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == user.id,
                        Notification.title.like("%Pending Patient%"),
                        Notification.created_at >= recent_cutoff,
                    )
                    .first()
                )
                if not existing:
                    count = len(pending_requests)
                    n = _create_notification(
                        db=db,
                        user_id=user.id,
                        category=NotificationCategory.PLATFORM,
                        title=f"Pending Patient Cases ({count})",
                        message=f"You have {count} pending patient connection request(s) awaiting your clinical review.",
                        priority=NotificationPriority.HIGH,
                        action_url="/dermatologist",
                    )
                    if n:
                        new_notifications.append(n)
        except Exception as e:
            db.rollback()
            logger.warning(f"Dermatologist pending requests sync error: {e}")

        # 3. Check for Urgent Referrals from Skincare Consultants
        try:
            from app.models.connection import ProfessionalConnection
            urgent_referrals = (
                db.query(ProfessionalConnection)
                .filter(
                    ProfessionalConnection.professional_id == user.id,
                    ProfessionalConnection.status == "PENDING",
                    ProfessionalConnection.referral_priority.in_(["HIGH_PRIORITY", "URGENT_CLINICAL_REVIEW"]),
                )
                .all()
            )
            if urgent_referrals:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == user.id,
                        Notification.title.like("%Urgent Colleague Referral%"),
                        Notification.created_at >= recent_cutoff,
                    )
                    .first()
                )
                if not existing:
                    count = len(urgent_referrals)
                    n = _create_notification(
                        db=db,
                        user_id=user.id,
                        category=NotificationCategory.PLATFORM,
                        title=f"Urgent Colleague Referral ({count})",
                        message=f"You have {count} high-priority patient case(s) referred by Skincare Consultants requiring clinical evaluation.",
                        priority=NotificationPriority.HIGH,
                        action_url="/dermatologist",
                    )
                    if n:
                        new_notifications.append(n)
        except Exception as e:
            db.rollback()
            logger.warning(f"Dermatologist urgent referral sync error: {e}")

        # 4. Check for Unread Patient & Colleague Chat Messages
        try:
            from app.models.chat import ChatMessage
            unread_chat_count = (
                db.query(ChatMessage)
                .filter(
                    ChatMessage.recipient_id == user.id,
                    ChatMessage.is_read == False,
                )
                .count()
            )
            if unread_chat_count > 0:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == user.id,
                        Notification.title.like("%Unread Clinical Message%"),
                        Notification.created_at >= recent_cutoff,
                    )
                    .first()
                )
                if not existing:
                    n = _create_notification(
                        db=db,
                        user_id=user.id,
                        category=NotificationCategory.PLATFORM,
                        title=f"Unread Clinical Messages ({unread_chat_count})",
                        message=f"You have {unread_chat_count} unread message(s) from patients or collaborating colleagues in your Care Circle.",
                        priority=NotificationPriority.MEDIUM,
                        action_url="/messages",
                    )
                    if n:
                        new_notifications.append(n)
        except Exception as e:
            db.rollback()
            logger.warning(f"Dermatologist unread message sync error: {e}")

        return new_notifications

    # =========================================================================
    # ROLE 2: SKINCARE CONSULTANT (Clinic / Skincare Professional)
    # =========================================================================
    if user_role == "SKINCARE_CONSULTANT":
        try:
            # 1. Purge stray consumer reminders for this consultant
            db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.category.in_([
                    NotificationCategory.ROUTINE,
                    NotificationCategory.HYDRATION,
                    NotificationCategory.SLEEP,
                ])
            ).delete(synchronize_session=False)
            db.commit()
        except Exception as e:
            db.rollback()
            logger.warning(f"Error purging consumer notifs for consultant {user.id}: {e}")

        # 2. Check for Pending Client Requests awaiting consultation
        try:
            from app.models.connection import ProfessionalConnection
            pending_requests = (
                db.query(ProfessionalConnection)
                .filter(
                    ProfessionalConnection.professional_id == user.id,
                    ProfessionalConnection.status == "PENDING",
                    ProfessionalConnection.initiator_id != user.id,
                )
                .all()
            )
            if pending_requests:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == user.id,
                        Notification.title.like("%Pending Client Request%"),
                        Notification.created_at >= recent_cutoff,
                    )
                    .first()
                )
                if not existing:
                    count = len(pending_requests)
                    n = _create_notification(
                        db=db,
                        user_id=user.id,
                        category=NotificationCategory.PLATFORM,
                        title=f"Pending Client Requests ({count})",
                        message=f"You have {count} pending client connection request(s) awaiting your consultation review.",
                        priority=NotificationPriority.HIGH,
                        action_url="/consultant",
                    )
                    if n:
                        new_notifications.append(n)
        except Exception as e:
            db.rollback()
            logger.warning(f"Consultant pending requests sync error: {e}")

        # 3. Check for Unread Client Inquiries / Messages
        try:
            from app.models.chat import ChatMessage
            unread_chat_count = (
                db.query(ChatMessage)
                .filter(
                    ChatMessage.recipient_id == user.id,
                    ChatMessage.is_read == False,
                )
                .count()
            )
            if unread_chat_count > 0:
                existing = (
                    db.query(Notification)
                    .filter(
                        Notification.user_id == user.id,
                        Notification.title.like("%Unread Client Message%"),
                        Notification.created_at >= recent_cutoff,
                    )
                    .first()
                )
                if not existing:
                    n = _create_notification(
                        db=db,
                        user_id=user.id,
                        category=NotificationCategory.PLATFORM,
                        title=f"Unread Client Messages ({unread_chat_count})",
                        message=f"You have {unread_chat_count} unread message(s) from connected clients or colleagues in your Care Circle.",
                        priority=NotificationPriority.MEDIUM,
                        action_url="/messages",
                    )
                    if n:
                        new_notifications.append(n)
        except Exception as e:
            db.rollback()
            logger.warning(f"Consultant unread message sync error: {e}")

        return new_notifications

    # =========================================================================
    # ROLE 3: ADMINISTRATOR
    # =========================================================================
    if user_role == "ADMINISTRATOR":
        try:
            db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.category.in_([
                    NotificationCategory.ROUTINE,
                    NotificationCategory.HYDRATION,
                    NotificationCategory.SLEEP,
                ])
            ).delete(synchronize_session=False)
            db.commit()
        except Exception:
            db.rollback()
        return new_notifications

    # =========================================================================
    # ROLE 4: REGULAR USER / PATIENT (Consumer Care Journey)
    # =========================================================================
    pref = _get_or_create_preference(db, user.id)
    if not pref:
        return []
    today = date.today()

    try:
        if pref.routine_reminders:
            active_routine = db.query(Routine).filter(Routine.user_id == user.id, Routine.is_active == True).first()
            if active_routine:
                existing = db.query(Notification).filter(Notification.user_id == user.id, Notification.category == NotificationCategory.ROUTINE, Notification.created_at >= recent_cutoff).first()
                if not existing:
                    n = _create_notification(db, user.id, NotificationCategory.ROUTINE, "Daily Routine Reminder", f"Don't forget your {active_routine.routine_type} skincare routine today! Consistent care drives real results.", NotificationPriority.MEDIUM, "/routine")
                    if n:
                        new_notifications.append(n)
    except Exception as e:
        db.rollback()
        logger.warning(f"Routine reminder sync error: {e}")

    try:
        if pref.hydration_reminders:
            hydration_today = db.query(HydrationRecord).filter(HydrationRecord.user_id == user.id, HydrationRecord.record_date == today).first()
            if not hydration_today:
                existing = db.query(Notification).filter(Notification.user_id == user.id, Notification.category == NotificationCategory.HYDRATION, Notification.created_at >= recent_cutoff).first()
                if not existing:
                    n = _create_notification(db, user.id, NotificationCategory.HYDRATION, "Hydration Check-In", "You haven't logged your water intake today. Aim for 2,000ml for optimal skin barrier health.", NotificationPriority.LOW, "/hydration")
                    if n:
                        new_notifications.append(n)
    except Exception as e:
        db.rollback()
        logger.warning(f"Hydration reminder sync error: {e}")

    try:
        if pref.sleep_reminders:
            sleep_today = db.query(SleepRecord).filter(SleepRecord.user_id == user.id, SleepRecord.record_date == today).first()
            if not sleep_today:
                existing = db.query(Notification).filter(Notification.user_id == user.id, Notification.category == NotificationCategory.SLEEP, Notification.created_at >= recent_cutoff).first()
                if not existing:
                    n = _create_notification(db, user.id, NotificationCategory.SLEEP, "Sleep Tracking Reminder", "Log your sleep to help DermaIQ correlate rest quality with your skin health trends.", NotificationPriority.LOW, "/sleep")
                    if n:
                        new_notifications.append(n)
    except Exception as e:
        db.rollback()
        logger.warning(f"Sleep reminder sync error: {e}")

    try:
        if pref.progress_alerts:
            snapshots = db.query(ProgressSnapshot).filter(ProgressSnapshot.user_id == user.id).order_by(ProgressSnapshot.created_at.desc()).limit(2).all()
            if len(snapshots) >= 2:
                delta = snapshots[0].overall_score - snapshots[1].overall_score
                if abs(delta) >= 5:
                    existing = db.query(Notification).filter(Notification.user_id == user.id, Notification.category == NotificationCategory.PROGRESS, Notification.created_at >= now - timedelta(days=7)).first()
                    if not existing:
                        direction = "improved" if delta > 0 else "declined"
                        priority = NotificationPriority.HIGH if abs(delta) >= 10 else NotificationPriority.MEDIUM
                        n = _create_notification(db, user.id, NotificationCategory.PROGRESS, f"Skin Health Score {direction.title()}", f"Your skin health score has {direction} by {abs(delta)} points since your last assessment. Review your progress trends.", priority, "/progress")
                        if n:
                            new_notifications.append(n)
    except Exception as e:
        db.rollback()
        logger.warning(f"Progress reminder sync error: {e}")

    return new_notifications
