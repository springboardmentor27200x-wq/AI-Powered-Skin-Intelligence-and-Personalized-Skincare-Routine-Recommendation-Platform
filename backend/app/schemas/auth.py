from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters long")
    confirm_password: str
    full_name: str = Field(..., min_length=1, description="Full name is required")
    role: Optional[str] = Field("USER", description="Target role: USER, SKINCARE_CONSULTANT, or DERMATOLOGIST")


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GoogleAuthInput(BaseModel):
    credential: str
