import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.skin_profile import SkinConcern

# Setup in-memory SQLite database for tests with StaticPool
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed concerns
    concerns = [
        SkinConcern(code="ACNE", name="Acne", description="Breakouts"),
        SkinConcern(code="DRY_SKIN", name="Dry Skin", description="Flaky skin"),
        SkinConcern(code="WRINKLES", name="Wrinkles", description="Fine lines"),
    ]
    session.add_all(concerns)
    session.commit()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        session = TestingSessionLocal()
        try:
            yield session
        finally:
            session.close()
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def get_auth_token(client, email="m2user@example.com", password="password123", name="Milestone2 User"):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "confirm_password": password,
            "full_name": name,
        }
    )
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    return res.json()["access_token"]


def test_assessment_precheck_flow(client):
    token = get_auth_token(client, "precheck@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Populate skin profile
    client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={
            "skin_type": "OILY",
            "allergies": "Salicylic Acid",
            "sensitivities": "High fragrance",
            "concern_ids": []
        }
    )

    # Log hydration
    client.post(
        "/api/v1/hydration",
        headers=headers,
        json={"water_intake_ml": 1800, "target_water_ml": 2000}
    )

    res = client.get("/api/v1/assessments/precheck", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["has_profile"] is True
    assert data["skin_type"] == "OILY"
    assert data["allergies"] == "Salicylic Acid"
    assert data["water_intake_ml"] == 1800
    assert data["has_previous_assessment"] is False


def test_run_assessment_creates_scores_and_routines(client):
    token = get_auth_token(client, "runner@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Setup profile with OILY skin & acne
    client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={
            "skin_type": "OILY",
            "allergies": "BHA",
            "sensitivities": None,
            "concern_ids": []
        }
    )

    # Setup lifestyle & sleep
    client.post(
        "/api/v1/lifestyle",
        headers=headers,
        json={"stress_level": 8, "smoking": "NONE", "alcohol": "LIGHT", "physical_activity": "MODERATE"}
    )
    client.post(
        "/api/v1/sleep",
        headers=headers,
        json={"duration_minutes": 450, "quality": "GOOD"}
    )

    # Run assessment
    run_res = client.post("/api/v1/assessments/run", headers=headers)
    assert run_res.status_code == 201
    assessment_data = run_res.json()

    assert assessment_data["status"] == "COMPLETED"
    assert "scores" in assessment_data
    assert assessment_data["scores"]["skin_condition_score"] > 0
    assert assessment_data["scores"]["overall_score"] > 0
    assert len(assessment_data["concerns"]) >= 1

    # Verify latest assessment endpoint
    latest_res = client.get("/api/v1/assessments/latest", headers=headers)
    assert latest_res.status_code == 200
    assert latest_res.json()["id"] == assessment_data["id"]

    # Verify routine was automatically created
    routine_res = client.get("/api/v1/routines/current", headers=headers)
    assert routine_res.status_code == 200
    routine_plan = routine_res.json()
    assert routine_plan["version"] == 1
    assert routine_plan["morning"] is not None
    assert len(routine_plan["morning"]["steps"]) == 4
    assert routine_plan["evening"] is not None
    assert len(routine_plan["evening"]["steps"]) == 4
    assert routine_plan["weekly"] is not None


def test_routine_version_increment(client):
    token = get_auth_token(client, "versioner@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.post("/api/v1/assessments/run", headers=headers)
    plan_v1 = client.get("/api/v1/routines/current", headers=headers).json()
    assert plan_v1["version"] == 1

    # Regenerate
    gen_res = client.post("/api/v1/routines/generate", headers=headers)
    assert gen_res.status_code == 201
    plan_v2 = gen_res.json()
    assert plan_v2["version"] == 2

    # Check history
    hist_res = client.get("/api/v1/routines/history", headers=headers)
    assert hist_res.status_code == 200
    # Should contain v2 and v1 routines
    assert len(hist_res.json()) >= 6  # 3 types * 2 versions


def test_security_isolation_unauthorized_assessment_access(client):
    token_a = get_auth_token(client, "user_a@example.com")
    token_b = get_auth_token(client, "user_b@example.com")

    headers_a = {"Authorization": f"Bearer {token_a}"}
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A runs assessment
    run_res = client.post("/api/v1/assessments/run", headers=headers_a)
    assessment_id = run_res.json()["id"]

    # User B tries to view User A's assessment
    unauth_res = client.get(f"/api/v1/assessments/{assessment_id}", headers=headers_b)
    assert unauth_res.status_code == 404
