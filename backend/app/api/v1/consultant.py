from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from app.db.session import get_db
from app.services.consultant_service import consultant_service
from app.core.dependencies import get_current_user

router = APIRouter()

class NoteRequest(BaseModel):
    note: str

@router.get("/clients", summary="Get all clients (Consultant View)")
def get_clients(db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # In a real app, we would verify current_user["role"] == "consultant"
    return consultant_service.get_all_clients(db)

@router.get("/clients/{client_id}", summary="Get specific client details")
def get_client_details(client_id: int, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    details = consultant_service.get_client_details(db, client_id)
    if not details:
        raise HTTPException(status_code=404, detail="Client not found")
    return details

@router.post("/clients/{client_id}/notes", summary="Add recommendation note for client")
def add_client_note(client_id: int, req: NoteRequest, db = Depends(get_db), current_user: dict = Depends(get_current_user)):
    return consultant_service.add_recommendation_note(db, client_id, req.note)
