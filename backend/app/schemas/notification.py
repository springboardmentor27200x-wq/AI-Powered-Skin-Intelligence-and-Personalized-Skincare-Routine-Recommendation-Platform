import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class NotificationOut(BaseModel):
    id: str
    type: str          # routine | hydration | sleep | progress | product | platform
    severity: str      # info | warning | success
    title: str
    message: str
    action_path: str | None = None
    created_at: datetime | None = None   # set for announcements only


class AnnouncementIn(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=1000)


class AnnouncementOut(BaseModel):
    id: uuid.UUID
    title: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True