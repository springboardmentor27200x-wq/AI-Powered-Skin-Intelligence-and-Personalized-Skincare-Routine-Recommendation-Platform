import uuid
from datetime import datetime, date, time
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.core.security import hash_password
from app.models.user import User, UserProfile
from app.models.skin_profile import SkinProfile, SkinConcern, UserSkinConcern
from app.models.lifestyle import LifestyleRecord
from app.models.sleep import SleepRecord
from app.models.hydration import HydrationRecord
from app.models.environment import EnvironmentalExposureRecord
from app.models.connection import ProfessionalConnection

CONCERNS_SEED = [
    {"code": "ACNE", "name": "Acne", "description": "Breakouts, blemishes, and pimples"},
    {"code": "HYPERPIGMENTATION", "name": "Hyperpigmentation", "description": "Darkened areas of skin"},
    {"code": "DARK_SPOTS", "name": "Dark Spots", "description": "Sun spots or age spots"},
    {"code": "DRY_SKIN", "name": "Dry Skin", "description": "Flaky, tight, or parched skin"},
    {"code": "OILY_SKIN", "name": "Oily Skin", "description": "Excess sebum and shiny complexion"},
    {"code": "SENSITIVE_SKIN", "name": "Sensitive Skin", "description": "Prone to redness, itching, or burning"},
    {"code": "WRINKLES", "name": "Wrinkles", "description": "Fine creases or deep lines"},
    {"code": "FINE_LINES", "name": "Fine Lines", "description": "Shallow creases on skin"},
    {"code": "REDNESS", "name": "Redness", "description": "Persistent flushing or broken capillaries"},
    {"code": "UNEVEN_SKIN_TONE", "name": "Uneven Skin Tone", "description": "Mottled skin coloring or blotchiness"},
]

USERS_SEED = [
    {
        "email": "user@example.com",
        "name": "Jane User",
        "role": "USER",
        "password": "password123",
        "location": "San Francisco, CA",
        "age_group": "25_34",
        "skin_type": "COMBINATION",
        "allergies": "Lanolin, Fragrance",
        "sensitivities": "High alcohol-based formulations",
        "concerns": ["DARK_SPOTS", "HYPERPIGMENTATION", "UNEVEN_SKIN_TONE"]
    },
    {
        "email": "patient@example.com",
        "name": "Mark Patient",
        "role": "USER",
        "password": "password123",
        "location": "Boston, MA",
        "age_group": "35_44",
        "skin_type": "SENSITIVE",
        "allergies": "Benzoyl Peroxide",
        "sensitivities": "Retinoids above 0.5%",
        "concerns": ["REDNESS", "SENSITIVE_SKIN", "DRY_SKIN"]
    },
    {
        "email": "consultant@example.com",
        "name": "Clara Consultant",
        "role": "SKINCARE_CONSULTANT",
        "password": "password123",
        "location": "New York, NY",
        "age_group": "25_34"
    },
    {
        "email": "consultant2@example.com",
        "name": "David Advisor",
        "role": "SKINCARE_CONSULTANT",
        "password": "password123",
        "location": "Austin, TX",
        "age_group": "35_44"
    },
    {
        "email": "dermatologist@example.com",
        "name": "Dr. Dan Dermatologist",
        "role": "DERMATOLOGIST",
        "password": "password123",
        "location": "Chicago, IL",
        "age_group": "45_54"
    },
    {
        "email": "dermatologist2@example.com",
        "name": "Dr. Sarah Skin",
        "role": "DERMATOLOGIST",
        "password": "password123",
        "location": "Seattle, WA",
        "age_group": "35_44"
    },
    {
        "email": "admin@example.com",
        "name": "Arthur Admin",
        "role": "ADMINISTRATOR",
        "password": "password123",
        "location": "Global Operations",
        "age_group": "35_44"
    }
]


def seed_db(db: Session):
    print("Seeding reference skin concerns...")
    concern_map = {}
    for item in CONCERNS_SEED:
        existing = db.query(SkinConcern).filter(SkinConcern.code == item["code"]).first()
        if not existing:
            concern = SkinConcern(
                code=item["code"],
                name=item["name"],
                description=item["description"]
            )
            db.add(concern)
            db.flush()
            concern_map[item["code"]] = concern
            print(f"Added concern: {item['code']}")
        else:
            concern_map[item["code"]] = existing
            print(f"Concern already exists: {item['code']}")

    print("\nSeeding mock users and profiles...")
    user_entities = {}
    for item in USERS_SEED:
        user = db.query(User).filter(User.email == item["email"]).first()
        if not user:
            user = User(
                email=item["email"],
                hashed_password=hash_password(item["password"]),
                role=item["role"],
                auth_provider="local",
                is_active=True,
                is_verified=True
            )
            db.add(user)
            db.flush()

            profile = UserProfile(
                user_id=user.id,
                name=item["name"],
                age_group=item.get("age_group", "25_34"),
                location=item.get("location", "San Francisco, CA")
            )
            db.add(profile)
            print(f"Created user: {item['email']} with role {item['role']}")
        else:
            print(f"User already exists: {item['email']}")

        user_entities[item["email"]] = user

        # Add skin profile & concerns if specified for USER role
        if item.get("skin_type"):
            existing_skin = db.query(SkinProfile).filter(SkinProfile.user_id == user.id).first()
            if not existing_skin:
                skin_prof = SkinProfile(
                    user_id=user.id,
                    skin_type=item["skin_type"],
                    allergies=item.get("allergies"),
                    sensitivities=item.get("sensitivities")
                )
                db.add(skin_prof)
                db.flush()

                # Add concerns
                for c_code in item.get("concerns", []):
                    if c_code in concern_map:
                        db.add(UserSkinConcern(skin_profile_id=skin_prof.id, concern_id=concern_map[c_code].id))

                # Add sample telemetry
                db.add(LifestyleRecord(
                    user_id=user.id,
                    physical_activity="MODERATE",
                    smoking="NONE",
                    alcohol="LIGHT",
                    stress_level=3,
                    record_date=date.today()
                ))
                db.add(SleepRecord(
                    user_id=user.id,
                    duration_minutes=450,
                    quality="GOOD",
                    bedtime="23:00",
                    wake_time="06:30",
                    record_date=date.today()
                ))
                db.add(HydrationRecord(
                    user_id=user.id,
                    water_intake_ml=2400,
                    target_water_ml=2500,
                    record_date=date.today()
                ))
                db.add(EnvironmentalExposureRecord(
                    user_id=user.id,
                    uv_exposure="MODERATE",
                    pollution_exposure="LOW",
                    outdoor_time_minutes=45,
                    climate="TEMPERATE",
                    record_date=date.today()
                ))

    # Seed connections demonstrating all workflows
    print("\nSeeding demonstration professional connections...")
    jane = user_entities.get("user@example.com")
    mark = user_entities.get("patient@example.com")
    clara = user_entities.get("consultant@example.com")
    dan = user_entities.get("dermatologist@example.com")

    if jane and clara:
        conn1 = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.user_id == jane.id,
            ProfessionalConnection.professional_id == clara.id
        ).first()
        if not conn1:
            db.add(ProfessionalConnection(
                user_id=jane.id,
                professional_id=clara.id,
                professional_type="SKINCARE_CONSULTANT",
                status="PENDING",
                requested_at=datetime.utcnow()
            ))
            print("Added pending connection: Jane User -> Clara Consultant")

    if mark and clara:
        conn2 = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.user_id == mark.id,
            ProfessionalConnection.professional_id == clara.id
        ).first()
        if not conn2:
            db.add(ProfessionalConnection(
                user_id=mark.id,
                professional_id=clara.id,
                professional_type="SKINCARE_CONSULTANT",
                status="ACCEPTED",
                requested_at=datetime.utcnow(),
                responded_at=datetime.utcnow()
            ))
            print("Added accepted connection: Mark Patient -> Clara Consultant")

    if jane and dan:
        conn3 = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.user_id == jane.id,
            ProfessionalConnection.professional_id == dan.id
        ).first()
        if not conn3:
            db.add(ProfessionalConnection(
                user_id=jane.id,
                professional_id=dan.id,
                professional_type="DERMATOLOGIST",
                status="PENDING",
                requested_at=datetime.utcnow()
            ))
            print("Added pending connection: Jane User -> Dr. Dan Dermatologist")

    if mark and dan:
        conn4 = db.query(ProfessionalConnection).filter(
            ProfessionalConnection.user_id == mark.id,
            ProfessionalConnection.professional_id == dan.id
        ).first()
        if not conn4:
            db.add(ProfessionalConnection(
                user_id=mark.id,
                professional_id=dan.id,
                professional_type="DERMATOLOGIST",
                status="ACCEPTED",
                requested_at=datetime.utcnow(),
                responded_at=datetime.utcnow()
            ))
            print("Added accepted connection: Mark Patient -> Dr. Dan Dermatologist")

    print("\nSeeding genuine datasets (ingredients, products, interactions)...")
    from app.db.seed_genuine_datasets import seed_genuine_datasets
    seed_genuine_datasets(db)

    db.commit()
    print("\nDatabase seeding completed successfully!")


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()
