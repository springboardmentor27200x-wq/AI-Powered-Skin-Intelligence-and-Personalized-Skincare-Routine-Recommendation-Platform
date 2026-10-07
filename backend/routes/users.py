from fastapi import APIRouter, Depends
from models import User
from schemas import UserResponse
from auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def current_user(user: User = Depends(get_current_user)):
    return user
