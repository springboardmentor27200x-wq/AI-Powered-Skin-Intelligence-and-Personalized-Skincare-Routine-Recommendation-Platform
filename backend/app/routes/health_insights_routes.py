from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..dependencies import get_current_user
from ..models import User
from ..services.health_insights import generate_health_insights


router = APIRouter(
    prefix="/api/health-insights",
    tags=["Health Insights"],
)


@router.get("/{user_id}")
def get_health_insights(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---------------------------------------------------------
    # ACCESS CONTROL
    # ---------------------------------------------------------
    # A normal user can only see their own insights.
    # Admin, consultant and dermatologist can view user insights.

    if (
        current_user.id != user_id
        and current_user.role not in (
            "admin",
            "consultant",
            "dermatologist",
        )
    ):
        return {
            "error": "You are not allowed to access this user's health insights."
        }

    # ---------------------------------------------------------
    # GENERATE INSIGHTS
    # ---------------------------------------------------------

    result = generate_health_insights(
        db=db,
        user_id=user_id,
    )

    # ---------------------------------------------------------
    # RETURN RESULT
    # ---------------------------------------------------------

    return result