from fastapi import APIRouter, Depends, status
from app.db.session import get_db
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.services.auth_service import auth_service
from app.core.dependencies import get_current_user

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, summary="Register a new user")
def register(req: RegisterRequest, db = Depends(get_db)):
    return auth_service.register_user(db=db, req=req)

@router.post("/login", response_model=TokenResponse, summary="User login with JWT generation")
def login(req: LoginRequest, db = Depends(get_db)):
    return auth_service.authenticate_user(db=db, req=req)

@router.get("/me", response_model=UserResponse, summary="Get current logged in user details")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
