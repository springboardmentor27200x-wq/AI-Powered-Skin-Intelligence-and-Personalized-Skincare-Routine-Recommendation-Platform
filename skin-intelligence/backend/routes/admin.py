from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.user import User, UserRole
from models.skin_assessment import SkinAssessment
from models.product import Product
from utils.auth import get_admin_user

router = APIRouter(prefix="/api/admin", tags=["Admin Dashboard"])

@router.get("/stats")
def get_platform_stats(current_admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """Get high-level platform statistics for the admin dashboard."""
    total_users = db.query(func.count(User.id)).scalar()
    total_assessments = db.query(func.count(SkinAssessment.id)).scalar()
    total_products = db.query(func.count(Product.id)).scalar()
    
    return {
        "total_users": total_users,
        "total_assessments": total_assessments,
        "total_products": total_products
    }

@router.get("/users")
def get_all_users(current_admin: User = Depends(get_admin_user), db: Session = Depends(get_db)):
    """List all users on the platform."""
    users = db.query(User).all()
    return [{"id": u.id, "email": u.email, "full_name": u.full_name, "role": u.role, "created_at": u.created_at} for u in users]
