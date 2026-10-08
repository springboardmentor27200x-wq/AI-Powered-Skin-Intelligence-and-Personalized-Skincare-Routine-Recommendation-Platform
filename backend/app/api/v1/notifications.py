from fastapi import APIRouter, Depends
from app.services.notification_service import notification_service
from app.db.session import get_db

router = APIRouter()

@router.get("/{user_id}")
def get_notifications(user_id: int, db = Depends(get_db)):
    return notification_service.get_notifications(db, user_id)
