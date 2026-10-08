from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_current_user, get_db
from app.models.user import User, UserProfile
from app.schemas.connection import PublicProfessionalResponse

router = APIRouter()


@router.get("", response_model=List[PublicProfessionalResponse])
def list_professionals(
    role: Optional[str] = Query(None, description="Filter by role: SKINCARE_CONSULTANT or DERMATOLOGIST"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    location: Optional[str] = Query(None, description="Filter by location"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search and discover professionals (Skincare Consultants and Dermatologists).
    Exposes only public directory information (no private user data).
    """
    query = db.query(User).join(UserProfile, User.id == UserProfile.user_id).filter(User.is_active == True)

    # Restrict to professional roles
    if role:
        if role not in ["SKINCARE_CONSULTANT", "DERMATOLOGIST"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid professional role filter"
            )
        query = query.filter(User.role == role)
    else:
        query = query.filter(User.role.in_(["SKINCARE_CONSULTANT", "DERMATOLOGIST"]))

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (UserProfile.name.ilike(search_pattern)) | 
            (User.email.ilike(search_pattern))
        )

    if location:
        location_pattern = f"%{location.strip()}%"
        query = query.filter(UserProfile.location.ilike(location_pattern))

    professionals = query.all()

    results = []
    for prof in professionals:
        results.append(PublicProfessionalResponse(
            id=prof.id,
            name=prof.profile.name if prof.profile else prof.email.split("@")[0],
            email=prof.email,
            role=prof.role,
            location=prof.profile.location if prof.profile else None,
            age_group=prof.profile.age_group if prof.profile else None
        ))

    return results


@router.get("/{id}", response_model=PublicProfessionalResponse)
def get_professional_public_profile(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get public profile card for a specific professional."""
    prof = db.query(User).filter(
        User.id == id,
        User.role.in_(["SKINCARE_CONSULTANT", "DERMATOLOGIST"]),
        User.is_active == True
    ).first()

    if not prof:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Professional not found or inactive"
        )

    return PublicProfessionalResponse(
        id=prof.id,
        name=prof.profile.name if prof.profile else prof.email.split("@")[0],
        email=prof.email,
        role=prof.role,
        location=prof.profile.location if prof.profile else None,
        age_group=prof.profile.age_group if prof.profile else None
    )
