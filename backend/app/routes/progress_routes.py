# from fastapi import APIRouter, Depends, HTTPException
# from sqlalchemy.orm import Session

# from app.database import get_db
# from app.models import User, SkinAssessment
# from app.dependencies import get_current_user

# from app.services.progress_engine import (
#     analyze_progress,
#     compare_before_after
# )


# router = APIRouter(
#     prefix="/api/progress",
#     tags=["Progress Tracking"]
# )


# # =========================================================
# # GET USER PROGRESS
# # =========================================================

# @router.get("/{user_id}")
# def get_user_progress(
#     user_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     # Security: user can only access their own progress
#     if current_user.id != user_id:
#         raise HTTPException(
#             status_code=403,
#             detail="You can only access your own progress."
#         )

#     assessments = (
#         db.query(SkinAssessment)
#         .filter(
#             SkinAssessment.user_id == user_id
#         )
#         .order_by(
#             SkinAssessment.created_at.asc()
#         )
#         .all()
#     )

#     return analyze_progress(assessments)


# # =========================================================
# # BEFORE / AFTER COMPARISON
# # =========================================================

# @router.get("/{user_id}/before-after")
# def get_before_after_progress(
#     user_id: int,
#     db: Session = Depends(get_db),
#     current_user: User = Depends(get_current_user)
# ):

#     # Security check
#     if current_user.id != user_id:
#         raise HTTPException(
#             status_code=403,
#             detail="You can only access your own progress."
#         )

#     assessments = (
#         db.query(SkinAssessment)
#         .filter(
#             SkinAssessment.user_id == user_id
#         )
#         .order_by(
#             SkinAssessment.created_at.asc()
#         )
#         .all()
#     )

#     return compare_before_after(assessments)
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, SkinAssessment
from app.dependencies import get_current_user

from app.services.progress_engine import (
    analyze_progress,
    compare_before_after
)

router = APIRouter(
    prefix="/api/progress",
    tags=["Progress Tracking"]
)


def check_progress_access(
    requested_user_id: int,
    current_user: User
):
    """
    Normal users can access only their own progress.
    Admins can access any user's progress.
    """

    # Admin can access any user's progress
    if current_user.role == "admin":
        return

    # Other roles can access only their own progress
    if current_user.id != requested_user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own progress."
        )


@router.get("/{user_id}/before-after")
def get_before_after_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    check_progress_access(user_id, current_user)

    assessments = (
        db.query(SkinAssessment)
        .filter(
            SkinAssessment.user_id == user_id
        )
        .order_by(
            SkinAssessment.created_at.asc()
        )
        .all()
    )

    return compare_before_after(assessments)


@router.get("/{user_id}")
def get_user_progress(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    check_progress_access(user_id, current_user)

    assessments = (
        db.query(SkinAssessment)
        .filter(
            SkinAssessment.user_id == user_id
        )
        .order_by(
            SkinAssessment.created_at.asc()
        )
        .all()
    )

    return analyze_progress(assessments)