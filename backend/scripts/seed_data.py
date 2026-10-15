"""
Database seed script for AI Skin Intelligence & Personalized Skincare Planner.
Populates demo accounts for all 4 roles and initial profile data.

Usage:
    python -m scripts.seed_data
"""
import sys
import os
from datetime import date, timedelta

# Add backend root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import LifestyleProfile
from app.models.sleep import SleepRecord
from app.models.hydration import HydrationRecord


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        demo_password = get_password_hash("Password123!")

        # 1. Administrator
        admin = db.query(User).filter(User.email == "admin@demo.com").first()
        if not admin:
            admin = User(
                full_name="System Administrator",
                email="admin@demo.com",
                password_hash=demo_password,
                role=UserRole.ADMINISTRATOR,
                is_active=True,
            )
            db.add(admin)
            print("[+] Created Administrator: admin@demo.com")

        # 2. Skincare Consultant
        consultant = db.query(User).filter(User.email == "consultant@demo.com").first()
        if not consultant:
            consultant = User(
                full_name="Sarah Jenkins (Consultant)",
                email="consultant@demo.com",
                password_hash=demo_password,
                role=UserRole.SKINCARE_CONSULTANT,
                is_active=True,
            )
            db.add(consultant)
            print("[+] Created Consultant: consultant@demo.com")

        # 3. Dermatologist
        derm = db.query(User).filter(User.email == "derm@demo.com").first()
        if not derm:
            derm = User(
                full_name="Dr. Elena Rostova (Dermatologist)",
                email="derm@demo.com",
                password_hash=demo_password,
                role=UserRole.DERMATOLOGIST,
                is_active=True,
            )
            db.add(derm)
            print("[+] Created Dermatologist: derm@demo.com")

        # 4. Standard User
        user = db.query(User).filter(User.email == "user@demo.com").first()
        if not user:
            user = User(
                full_name="Alex Rivera",
                email="user@demo.com",
                password_hash=demo_password,
                role=UserRole.USER,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print("[+] Created User: user@demo.com")

            # Seed Skin Profile for User
            skin_prof = SkinProfile(
                user_id=user.id,
                skin_type="Combination",
                age_group="25-34",
                skin_concerns=["Acne", "Hyperpigmentation", "Uneven Skin Tone"],
                allergies="Synthetic fragrance",
                sensitivities="High percentage Glycolic acid",
            )
            db.add(skin_prof)
            print("  [+] Seeded skin profile for Alex Rivera")

            # Seed Lifestyle Profile for User
            lifestyle = LifestyleProfile(
                user_id=user.id,
                physical_activity="Moderate",
                smoking="Never",
                alcohol_consumption="Occasionally",
                screen_time_hours=7.5,
                outdoor_exposure="Moderate (1-3 hours)",
                pollution_exposure="Moderate",
                sun_exposure="Moderate",
                environment_type="Air-conditioned office / Urban",
            )
            db.add(lifestyle)
            print("  [+] Seeded lifestyle profile for Alex Rivera")

            # Seed Sleep Records
            today = date.today()
            sleep1 = SleepRecord(
                user_id=user.id,
                sleep_duration_hours=7.5,
                sleep_quality="Good",
                bedtime="23:30",
                wake_time="07:00",
                sleep_consistency="Consistent",
                record_date=today,
            )
            sleep2 = SleepRecord(
                user_id=user.id,
                sleep_duration_hours=6.5,
                sleep_quality="Fair",
                bedtime="00:15",
                wake_time="06:45",
                sleep_consistency="Consistent",
                record_date=today - timedelta(days=1),
            )
            db.add_all([sleep1, sleep2])
            print("  [+] Seeded sleep records for Alex Rivera")

            # Seed Hydration Records
            hydra1 = HydrationRecord(
                user_id=user.id,
                water_intake_ml=1500,
                record_date=today,
            )
            hydra2 = HydrationRecord(
                user_id=user.id,
                water_intake_ml=750,
                record_date=today,
            )
            hydra3 = HydrationRecord(
                user_id=user.id,
                water_intake_ml=2000,
                record_date=today - timedelta(days=1),
            )
            db.add_all([hydra1, hydra2, hydra3])
            print("  [+] Seeded hydration records for Alex Rivera")

        db.commit()
        print("\n>>> Seed data successfully loaded!")
        print("\nDemo Credentials (Password for all: 'Password123!'):")
        print("  - User:         user@demo.com")
        print("  - Consultant:   consultant@demo.com")
        print("  - Dermatologist: derm@demo.com")
        print("  - Admin:        admin@demo.com")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
