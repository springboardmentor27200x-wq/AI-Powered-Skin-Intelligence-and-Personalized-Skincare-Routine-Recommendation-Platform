from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from typing import List, Optional
from pydantic import BaseModel

from database import get_db
from models.user import User
from models.notification import Notification, NotificationSetting, ProductReplenishment
from models.lifestyle_log import LifestyleLog
from models.skincare_routine import SkincareRoutine
from utils.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["Notifications & Reminders"])


# ── Pydantic Schemas ──────────────────────────────────────────
class NotificationSettingIn(BaseModel):
    am_reminder_enabled: Optional[bool] = True
    am_reminder_time: Optional[str] = "08:00"
    pm_reminder_enabled: Optional[bool] = True
    pm_reminder_time: Optional[str] = "21:00"
    midday_spf_reminder_enabled: Optional[bool] = True
    midday_spf_time: Optional[str] = "13:00"
    replenishment_alerts_enabled: Optional[bool] = True
    cycling_phase_alerts_enabled: Optional[bool] = True


class ProductReplenishmentIn(BaseModel):
    product_name: str
    category: Optional[str] = "Moisturizer"
    bottle_size_ml: Optional[int] = 50
    opened_date: str
    estimated_lifespan_days: Optional[int] = 45
    daily_usage_frequency: Optional[int] = 1


# ── Helper: Generate Smart Notifications ─────────────────────
def sync_smart_notifications(user: User, db: Session):
    today = date.today()
    settings = db.query(NotificationSetting).filter(NotificationSetting.user_id == user.id).first()
    if not settings:
        settings = NotificationSetting(user_id=user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    # 1. Check if user has seeded product replenishments; if empty, seed default items from their routine/catalog
    tracked = db.query(ProductReplenishment).filter(ProductReplenishment.user_id == user.id).all()
    if not tracked:
        defaults = [
            ProductReplenishment(
                user_id=user.id,
                product_name="Ultra-Light Daily UV Defense SPF 50+",
                category="Sunscreen",
                bottle_size_ml=50,
                opened_date=(today - timedelta(days=23)).isoformat(),
                estimated_lifespan_days=30,
                daily_usage_frequency=1,
                remaining_percentage=23,
                status="LOW"
            ),
            ProductReplenishment(
                user_id=user.id,
                product_name="Encapsulated Retinol 0.3% Resurfacing Serum",
                category="Treatment",
                bottle_size_ml=30,
                opened_date=(today - timedelta(days=40)).isoformat(),
                estimated_lifespan_days=60,
                daily_usage_frequency=1,
                remaining_percentage=33,
                status="GOOD"
            ),
            ProductReplenishment(
                user_id=user.id,
                product_name="Multi-Ceramide Barrier Recovery Gel-Cream",
                category="Moisturizer",
                bottle_size_ml=60,
                opened_date=(today - timedelta(days=12)).isoformat(),
                estimated_lifespan_days=50,
                daily_usage_frequency=2,
                remaining_percentage=76,
                status="GOOD"
            )
        ]
        db.add_all(defaults)
        db.commit()
        tracked = defaults

    # 2. Update status and remaining percentage for each tracked product
    for item in tracked:
        try:
            opened = datetime.strptime(item.opened_date, "%Y-%m-%d").date()
            days_open = (today - opened).days
            total_days = max(1, item.estimated_lifespan_days)
            remaining_days = max(0, total_days - days_open)
            pct = max(0, min(100, int((remaining_days / total_days) * 100)))
            item.remaining_percentage = pct
            
            if pct <= 0:
                item.status = "EMPTY"
            elif pct <= 25:
                item.status = "LOW"
            else:
                item.status = "GOOD"
        except Exception:
            pass
    db.commit()

    # 3. Check for replenishment notification
    if settings.replenishment_alerts_enabled:
        for item in tracked:
            if item.status in ["LOW", "EMPTY"]:
                existing = db.query(Notification).filter(
                    Notification.user_id == user.id,
                    Notification.notification_type == "REPLENISHMENT",
                    Notification.title.like(f"%{item.product_name[:15]}%"),
                    Notification.is_dismissed == False
                ).first()
                if not existing:
                    notif = Notification(
                        user_id=user.id,
                        title=f"🧴 Restock Alert: {item.product_name}",
                        message=f"Your {item.category} has only {item.remaining_percentage}% remaining (~{max(0, item.estimated_lifespan_days - (today - datetime.strptime(item.opened_date, '%Y-%m-%d').date()).days)} days left). Reorder soon to avoid interrupting your barrier regimen.",
                        notification_type="REPLENISHMENT",
                        priority="HIGH" if item.status == "EMPTY" else "NORMAL",
                        action_url="#products",
                        action_label="View Products"
                    )
                    db.add(notif)
                    db.commit()

    # 4. Check for AM Routine Reminder
    if settings.am_reminder_enabled:
        existing_am = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.notification_type == "ROUTINE",
            Notification.title.like("☀️ Morning Routine Reminder%"),
            Notification.created_at >= datetime.combine(today, datetime.min.time())
        ).first()
        if not existing_am:
            notif = Notification(
                user_id=user.id,
                title="☀️ Morning Routine Reminder",
                message=f"Time for your AM regimen! Cleanse gently, apply antioxidants, and finish with broad-spectrum SPF 50+.",
                notification_type="ROUTINE",
                priority="NORMAL",
                action_url="#routine",
                action_label="Open AM Routine"
            )
            db.add(notif)
            db.commit()

    # 5. Check for Evening Skin Cycling Reminder
    if settings.cycling_phase_alerts_enabled:
        existing_cycle = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.notification_type == "CYCLING",
            Notification.created_at >= datetime.combine(today, datetime.min.time())
        ).first()
        if not existing_cycle:
            notif = Notification(
                user_id=user.id,
                title="🌙 Night Skincare & Cycling Directive",
                message="Tonight's Protocol: Double cleanse and follow your active cycling phase. Remember to seal with barrier moisturizer.",
                notification_type="CYCLING",
                priority="NORMAL",
                action_url="#skincycle",
                action_label="View Tonight's Directive"
            )
            db.add(notif)
            db.commit()


# ── Endpoints ─────────────────────────────────────────────────

@router.get("")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sync_smart_notifications(current_user, db)
    
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_dismissed == False
    ).order_by(Notification.created_at.desc()).limit(30).all()
    
    unread_count = sum(1 for n in notifications if not n.is_read)
    
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "priority": n.priority,
                "is_read": n.is_read,
                "action_url": n.action_url,
                "action_label": n.action_label,
                "created_at": n.created_at.isoformat()
            }
            for n in notifications
        ]
    }


@router.post("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}


@router.post("/{notification_id}/dismiss")
def dismiss_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_dismissed = True
    db.commit()
    return {"message": "Notification dismissed"}


@router.get("/settings")
def get_notification_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == current_user.id
    ).first()
    if not settings:
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    return {
        "am_reminder_enabled": settings.am_reminder_enabled,
        "am_reminder_time": settings.am_reminder_time,
        "pm_reminder_enabled": settings.pm_reminder_enabled,
        "pm_reminder_time": settings.pm_reminder_time,
        "midday_spf_reminder_enabled": settings.midday_spf_reminder_enabled,
        "midday_spf_time": settings.midday_spf_time,
        "replenishment_alerts_enabled": settings.replenishment_alerts_enabled,
        "cycling_phase_alerts_enabled": settings.cycling_phase_alerts_enabled,
    }


@router.post("/settings")
def update_notification_settings(
    settings_in: NotificationSettingIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.user_id == current_user.id
    ).first()
    if not settings:
        settings = NotificationSetting(user_id=current_user.id)
        db.add(settings)

    for field, val in settings_in.dict(exclude_unset=True).items():
        setattr(settings, field, val)

    db.commit()
    return {"message": "Notification settings updated successfully"}


@router.get("/replenishments")
def get_product_replenishments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sync_smart_notifications(current_user, db)
    items = db.query(ProductReplenishment).filter(
        ProductReplenishment.user_id == current_user.id
    ).order_by(ProductReplenishment.remaining_percentage.asc()).all()
    
    today = date.today()
    result = []
    for item in items:
        opened = datetime.strptime(item.opened_date, "%Y-%m-%d").date()
        days_used = (today - opened).days
        days_left = max(0, item.estimated_lifespan_days - days_used)
        result.append({
            "id": item.id,
            "product_name": item.product_name,
            "category": item.category,
            "bottle_size_ml": item.bottle_size_ml,
            "opened_date": item.opened_date,
            "estimated_lifespan_days": item.estimated_lifespan_days,
            "daily_usage_frequency": item.daily_usage_frequency,
            "remaining_percentage": item.remaining_percentage,
            "days_left": days_left,
            "status": item.status
        })
    return result


@router.post("/replenishments")
def add_product_replenishment(
    item_in: ProductReplenishmentIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    new_item = ProductReplenishment(
        user_id=current_user.id,
        product_name=item_in.product_name,
        category=item_in.category,
        bottle_size_ml=item_in.bottle_size_ml,
        opened_date=item_in.opened_date,
        estimated_lifespan_days=item_in.estimated_lifespan_days,
        daily_usage_frequency=item_in.daily_usage_frequency,
        remaining_percentage=100,
        status="GOOD"
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return {"message": "Product replenishment tracking added", "id": new_item.id}


@router.post("/replenishments/{item_id}/restock")
def restock_product(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ProductReplenishment).filter(
        ProductReplenishment.id == item_id,
        ProductReplenishment.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tracked product not found")

    item.opened_date = date.today().isoformat()
    item.remaining_percentage = 100
    item.status = "GOOD"
    db.commit()
    return {"message": f"Restocked {item.product_name}! Bottle reset to 100%."}


@router.delete("/replenishments/{item_id}")
def delete_product_replenishment(
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    item = db.query(ProductReplenishment).filter(
        ProductReplenishment.id == item_id,
        ProductReplenishment.user_id == current_user.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Tracked product not found")
        
    db.delete(item)
    db.commit()
    return {"message": "Product untracked successfully"}
