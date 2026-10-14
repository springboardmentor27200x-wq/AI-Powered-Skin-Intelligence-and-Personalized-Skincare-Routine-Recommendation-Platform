import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.deps import require_roles
from app.models.user import User, UserRole
from app.models.skin_profile import SkinProfile
from app.models.lifestyle_record import LifestyleRecord
from app.schemas.admin import AdminUserOut, UpdateUserRole, UpdateUserStatus, PlatformStats
from collections import Counter
from sqlalchemy import func

from app.models.skin_assessment import SkinAssessment
from app.models.routine import Routine
from app.models.routine_adherence import RoutineAdherenceLog
from app.models.ingredient import Ingredient
from app.models.product import Product
from app.schemas.admin import PlatformAnalyticsOut  # add PlatformAnalyticsOut alongside your existing admin schema imports
from app.services.assessment_engine import recent_window

router = APIRouter(prefix="/admin", tags=["Admin"])

require_admin = require_roles(UserRole.administrator)


@router.get("/users", response_model=list[AdminUserOut])
def list_users(
    role: Optional[UserRole] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None, description="Match against name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    query = db.query(User)
    if role is not None:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    if search:
        like = f"%{search}%"
        query = query.filter((User.full_name.ilike(like)) | (User.email.ilike(like)))
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=AdminUserOut)
def get_user(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@router.patch("/users/{user_id}/role", response_model=AdminUserOut)
def update_user_role(
    user_id: uuid.UUID,
    payload: UpdateUserRole,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You can't change your own role.")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/status", response_model=AdminUserOut)
def update_user_status(
    user_id: uuid.UUID,
    payload: UpdateUserStatus,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You can't deactivate your own account.")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.get("/stats", response_model=PlatformStats)
def platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active.is_(True)).count()
    users_by_role = {role.value: db.query(User).filter(User.role == role).count() for role in UserRole}
    total_skin_profiles = db.query(SkinProfile).count()
    total_daily_logs = db.query(LifestyleRecord).count()

    return PlatformStats(
        total_users=total_users,
        users_by_role=users_by_role,
        active_users=active_users,
        inactive_users=total_users - active_users,
        total_skin_profiles=total_skin_profiles,
        total_daily_logs=total_daily_logs,
    )
@router.get("/analytics", response_model=PlatformAnalyticsOut)
def platform_analytics(db: Session = Depends(get_db), admin: User=Depends(require_admin)):
    total_assessments = db.query(SkinAssessment).count()
    total_routines = db.query(Routine).count()
    total_ingredients = db.query(Ingredient).count()
    total_products = db.query(Product).count()

    # Latest assessment per user, for average score + top concern
    latest_subq = (
        db.query(
            SkinAssessment.user_id,
            func.max(SkinAssessment.created_at).label("max_created"),
        )
        .group_by(SkinAssessment.user_id)
        .subquery()
    )
    latest_assessments = (
        db.query(SkinAssessment)
        .join(
            latest_subq,
            (SkinAssessment.user_id == latest_subq.c.user_id)
            & (SkinAssessment.created_at == latest_subq.c.max_created),
        )
        .all()
    )

    average_score = None
    top_concern = None
    top_concern_count = 0
    if latest_assessments:
        average_score = round(sum(a.score for a in latest_assessments) / len(latest_assessments), 1)
        top_concerns = [a.prioritized_concerns[0] for a in latest_assessments if a.prioritized_concerns]
        if top_concerns:
            most_common = Counter(top_concerns).most_common(1)[0]
            top_concern, top_concern_count = most_common[0], most_common[1]

    # Platform-wide routine adherence over the last 7 days
    since = recent_window(7)
    adherence_rows = db.query(RoutineAdherenceLog).filter(RoutineAdherenceLog.log_date >= since).all()
    platform_adherence_rate = None
    if adherence_rows:
        total_slots = len(adherence_rows) * 2
        completed_slots = sum(
            (1 if r.morning_completed else 0) + (1 if r.evening_completed else 0) for r in adherence_rows
        )
        platform_adherence_rate = round((completed_slots / total_slots) * 100, 1) if total_slots else None

    return PlatformAnalyticsOut(
        total_assessments=total_assessments,
        average_score=average_score,
        total_routines=total_routines,
        total_ingredients=total_ingredients,
        total_products=total_products,
        top_concern=top_concern,
        top_concern_count=top_concern_count,
        platform_adherence_rate=platform_adherence_rate,
    )