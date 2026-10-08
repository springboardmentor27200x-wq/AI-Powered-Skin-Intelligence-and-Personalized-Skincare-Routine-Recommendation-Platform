from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class UserProfileBase(BaseModel):
    name: str
    age_group: Optional[str] = None
    location: Optional[str] = None


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    age_group: Optional[str] = None
    location: Optional[str] = None


class UserProfileResponse(UserProfileBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    id: UUID
    email: str
    role: str
    auth_provider: str
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    last_login: Optional[datetime] = None
    profile: Optional[UserProfileResponse] = None

    class Config:
        from_attributes = True
class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
