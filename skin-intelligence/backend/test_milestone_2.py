import sys
import os

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, engine, Base
from models import User, SkinProfile

# Create tables
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def run_test():
    # 1. Register a test user
    print("Registering test user...")
    register_response = client.post("/api/auth/register", json={
        "email": "testuser_m2_new@example.com",
        "password": "Password123!",
        "full_name": "Milestone 2 Test User"
    })
    
    if register_response.status_code == 400 and "already registered" in register_response.text:
        print("User already exists, logging in...")
        login_response = client.post("/api/auth/login", data={
            "username": "testuser_m2_new@example.com",
            "password": "Password123!"
        })
        token = login_response.json()["access_token"]
    else:
        assert register_response.status_code == 201, register_response.text
        token = register_response.json()["access_token"]
        
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Create Skin Profile
    print("Creating skin profile...")
    profile_response = client.post("/api/profile/", json={
        "skin_type": "Combination",
        "age_group": "25-34",
        "skin_concerns": ["Acne", "Dark Spots"],
        "allergies": [],
        "sensitivities": []
    }, headers=headers)
    
    # 3. Run Assessment (Milestone 2)
    print("Running Assessment...")
    assessment_response = client.post("/api/assessment/run", headers=headers)
    assert assessment_response.status_code in [200, 201], assessment_response.text
    assessment_data = assessment_response.json()
    print("Assessment Result:")
    print("Overall Score:", assessment_data["assessment"]["overall_score"])
    print("Critical Concerns:", [c["concern"] for c in assessment_data["assessment"]["concern_analysis"] if c["severity"] == "Critical"])
    
    # 4. Generate Routine (Milestone 2)
    print("Generating Routine...")
    routine_response = client.post("/api/routine/generate", headers=headers)
    assert routine_response.status_code in [200, 201], routine_response.text
    routine_data = routine_response.json()
    print("Routine Result:")
    print("Morning Steps:", len(routine_data["routine"]["morning_routine"]))
    print("Evening Steps:", len(routine_data["routine"]["evening_routine"]))
    print("Weekly Treatments:", len(routine_data["routine"]["weekly_treatments"]))

    print("\nSUCCESS: Milestone 2 Backend is fully operational.")

if __name__ == "__main__":
    run_test()
