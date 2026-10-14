from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.client_note import ClientNote
from app.schemas.client_note import ClientNoteIn, ClientNoteOut

router = APIRouter(prefix="/clients", tags=["clients"])

# Each role writes and reads only its own note type — this is the real
# divergence between the two dashboards, not just different labels.
ROLE_NOTE_TYPE = {
    UserRole.skincare_consultant: "recommendation",
    UserRole.dermatologist: "treatment",
}


def _note_type_for(current_user: User) -> str:
    note_type = ROLE_NOTE_TYPE.get(current_user.role)
    if not note_type:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This role cannot manage client notes")
    return note_type


def _to_out(note: ClientNote, author_name: str) -> ClientNoteOut:
    return ClientNoteOut(
        id=note.id, client_id=note.client_id, author_id=note.author_id,
        author_name=author_name, note_type=note.note_type,
        content=note.content, created_at=note.created_at,
    )


@router.get("/{client_id}/notes", response_model=list[ClientNoteOut])
def list_client_notes(
    client_id: str,
    current_user: User = Depends(require_roles(UserRole.skincare_consultant, UserRole.dermatologist)),
    db: Session = Depends(get_db),
):
    note_type = _note_type_for(current_user)
    notes = (
        db.query(ClientNote)
        .filter(ClientNote.client_id == client_id, ClientNote.note_type == note_type)
        .order_by(ClientNote.created_at.desc())
        .all()
    )
    results = []
    for n in notes:
        author = db.query(User).filter(User.id == n.author_id).first()
        results.append(_to_out(n, author.full_name if author else "Unknown"))
    return results


@router.post("/{client_id}/notes", response_model=ClientNoteOut, status_code=status.HTTP_201_CREATED)
def add_client_note(
    client_id: str,
    payload: ClientNoteIn,
    current_user: User = Depends(require_roles(UserRole.skincare_consultant, UserRole.dermatologist)),
    db: Session = Depends(get_db),
):
    note_type = _note_type_for(current_user)
    client = db.query(User).filter(User.id == client_id, User.role == UserRole.user).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    note = ClientNote(client_id=client_id, author_id=current_user.id, note_type=note_type, content=payload.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return _to_out(note, current_user.full_name)