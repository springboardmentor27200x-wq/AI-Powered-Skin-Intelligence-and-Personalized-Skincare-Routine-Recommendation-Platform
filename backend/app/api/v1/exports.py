from fastapi import APIRouter, Depends
from app.services.export_service import export_service
from app.db.session import get_db

router = APIRouter()

@router.get("/pdf/{user_id}")
def export_pdf(user_id: int, db = Depends(get_db)):
    return export_service.export_reports(db, user_id, "pdf")

@router.get("/excel/{user_id}")
def export_excel(user_id: int, db = Depends(get_db)):
    return export_service.export_reports(db, user_id, "excel")
