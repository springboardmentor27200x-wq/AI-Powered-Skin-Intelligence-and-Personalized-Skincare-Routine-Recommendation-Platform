from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, model_validator
from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=150, description="User's full name")
    email: EmailStr = Field(..., description="User's unique email address")


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Password (at least 6 characters)")
    confirm_password: str = Field(..., min_length=6, max_length=100, description="Confirm password")
    role: Optional[UserRole] = Field(default=UserRole.USER, description="User role (USER, SKINCARE_CONSULTANT, DERMATOLOGIST)")

    @model_validator(mode="after")
    def validate_passwords_and_role(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match.")
        if self.role == UserRole.ADMINISTRATOR:
            raise ValueError("Public registration as ADMINISTRATOR is not allowed.")
        return self


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[EmailStr] = None


class UserPasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6, max_length=100)
    confirm_new_password: str = Field(..., min_length=6, max_length=100)

    @model_validator(mode="after")
    def validate_new_passwords(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New passwords do not match.")
        return self


class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
