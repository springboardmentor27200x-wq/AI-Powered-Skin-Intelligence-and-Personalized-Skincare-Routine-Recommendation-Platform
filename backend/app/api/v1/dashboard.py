from fastapi import APIRouter, Depends
from app.services.dashboard_service import dashboard_service
from app.db.session import get_db

router = APIRouter()

@router.get("/user/{user_id}")
def user_dashboard(user_id: int, db = Depends(get_db)):
    profile = db["skin_profiles"].find_one({"user_id": user_id}) or {}
    return dashboard_service.get_user_dashboard(db, user_id, profile)

@router.get("/consultant")
def consultant_dashboard(db = Depends(get_db)):
    return dashboard_service.get_consultant_dashboard(db)

@router.get("/dermatologist")
def dermatologist_dashboard(db = Depends(get_db)):
    return dashboard_service.get_dermatologist_dashboard(db)

@router.get("/admin")
def admin_dashboard(db = Depends(get_db)):
    return dashboard_service.get_admin_dashboard(db)
