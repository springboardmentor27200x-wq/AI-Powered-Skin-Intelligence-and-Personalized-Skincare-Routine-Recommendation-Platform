import uuid
from datetime import datetime

from pydantic import BaseModel


class ClientNoteIn(BaseModel):
    content: str


class ClientNoteOut(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    note_type: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True