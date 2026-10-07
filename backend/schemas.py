from typing import List
from pydantic import BaseModel, EmailStr, Field

class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    age: int = Field(ge=1, le=120)
    gender: str = Field(min_length=1, max_length=50)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    age: int
    gender: str
    role: str
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class ProfileRequest(BaseModel):
    skin_type: str
    age_group: str
    skin_concerns: List[str] = []
    allergies: str = ""
    sensitivities: str = ""
    lifestyle_habits: str = ""
    sleep_quality: str
    water_intake: float = Field(ge=0, le=100)
    sun_exposure: str = ""
    pollution_exposure: str = ""

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    skin_type: str
    age_group: str
    skin_concerns: List[str]
    allergies: str
    sensitivities: str
    lifestyle_habits: str
    sleep_quality: str
    water_intake: float
    sun_exposure: str
    pollution_exposure: str
    model_config = {"from_attributes": True}
