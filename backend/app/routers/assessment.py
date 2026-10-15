from fastapi import APIRouter, Depends, status
from app.dependencies.auth import get_current_active_user
from app.schemas.assessment import AssessmentInput, AssessmentResult
from app.services.assessment_service import assess_user

router = APIRouter(prefix="/assessment", tags=["Assessment"])

@router.post("/", response_model=AssessmentResult, status_code=status.HTTP_200_OK)
def run_assessment(
    assessment: AssessmentInput,
    current_user = Depends(get_current_active_user)
):
    """Execute the skin assessment for the authenticated user.

    The placeholder service currently uses rule‑based scoring; in the future this can be
    replaced with an ML model that incorporates the user's profile.
    """
    return assess_user(assessment)
