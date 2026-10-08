import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.skin_profile import SkinConcern
from app.models.routine import Routine, RoutineStep

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
    concerns = [
        SkinConcern(code="ACNE", name="Acne", description="Breakouts"),
        SkinConcern(code="DRY_SKIN", name="Dry Skin", description="Flaky skin"),
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


def register_and_get_token(client, email="user@example.com", role="USER"):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "password123",
            "confirm_password": "password123",
            "full_name": f"Test {role}",
            "role": role,
        }
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"}
    )
    return login_resp.json()["access_token"]


def test_barrier_forecast_and_analytics_endpoints(client):
    token = register_and_get_token(client, email="forecast_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Setup skin profile
    client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={"skin_type": "DRY", "sensitivity_level": "HIGH", "barrier_status": "COMPROMISED", "concerns": ["DRY_SKIN"]}
    )

    # Run assessment
    ass_resp = client.post("/api/v1/assessments/run", headers=headers)
    assert ass_resp.status_code == 201

    # 1. 7-Day Barrier Forecast
    fc_resp = client.get("/api/v1/assessments/forecast/barrier-7day", headers=headers)
    assert fc_resp.status_code == 200
    fc_data = fc_resp.json()
    assert "current_barrier_score" in fc_data
    assert "trajectory" in fc_data
    assert len(fc_data["trajectory"]) == 7
    assert fc_data["trajectory"][0]["day_offset"] == 1
    assert "tewl_risk_index" in fc_data["trajectory"][0]
    assert len(fc_data["clinical_advisory_tips"]) >= 1

    # 2. Telemetry Timeline Analytics
    tl_resp = client.get("/api/v1/assessments/analytics/timeline?days=14", headers=headers)
    assert tl_resp.status_code == 200
    tl_data = tl_resp.json()
    assert "data_points" in tl_data
    assert len(tl_data["data_points"]) >= 14
    assert "correlations" in tl_data


def test_routine_seasonal_and_product_recommendations(client):
    token = register_and_get_token(client, email="routine_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={"skin_type": "OILY", "sensitivity_level": "LOW", "concerns": ["ACNE"]}
    )

    client.post("/api/v1/assessments/run", headers=headers)

    plan_resp = client.get("/api/v1/routines/current", headers=headers)
    assert plan_resp.status_code == 200
    plan = plan_resp.json()

    assert plan["morning"] is not None
    assert plan["evening"] is not None
    assert plan["weekly"] is not None
    assert plan["seasonal"] is not None

    # Check product recommendations on steps
    first_step = plan["morning"]["steps"][0]
    assert "product_recommendations" in first_step
    assert len(first_step["product_recommendations"]) >= 1
    prod = first_step["product_recommendations"][0]
    assert "name" in prod
    assert "match_score" in prod
    assert prod["allergen_tested"] is True


def test_routine_adherence_tracking(client):
    token = register_and_get_token(client, email="adherence_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={"skin_type": "NORMAL", "sensitivity_level": "LOW", "concerns": []}
    )

    client.post("/api/v1/assessments/run", headers=headers)
    plan = client.get("/api/v1/routines/current", headers=headers).json()
    step_id = plan["morning"]["steps"][0]["id"]

    # Toggle adherence for today
    toggle_resp = client.post(
        "/api/v1/routines/adherence/toggle",
        headers=headers,
        json={"routine_step_id": step_id}
    )
    assert toggle_resp.status_code == 200
    assert toggle_resp.json()["completed"] is True
    assert "adherence_score" in toggle_resp.json()

    # Get summary
    sum_resp = client.get("/api/v1/routines/adherence/summary", headers=headers)
    assert sum_resp.status_code == 200
    summary = sum_resp.json()
    assert summary["streak_days"] >= 1
    assert step_id in summary["today_completed_step_ids"]
    assert len(summary["history_7d"]) == 7


def test_professional_recommendation_flow(client):
    # Register patient
    patient_token = register_and_get_token(client, email="patient@example.com", role="USER")
    p_headers = {"Authorization": f"Bearer {patient_token}"}
    p_me = client.get("/api/v1/users/me", headers=p_headers).json()
    patient_id = p_me["id"]

    # Register dermatologist
    doc_token = register_and_get_token(client, email="dr_smith@example.com", role="DERMATOLOGIST")
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # Create recommendation
    rec_resp = client.post(
        "/api/v1/recommendations",
        headers=doc_headers,
        json={
            "patient_id": patient_id,
            "title": "Clinical Lipid Barrier & Retinoid Protocol",
            "clinical_notes": "Patient presents with barrier sensitivity. Discontinue mechanical scrubs.",
            "prescribed_actives": ["Ceramide NP", "Panthenol 5%"],
            "recommended_products": [{"name": "CeraVe Moisturizing Cream", "timing": "Morning & Evening"}],
            "contraindications": ["Avoid strong glycolic acid during barrier repair phase"],
            "follow_up_weeks": 3
        }
    )
    assert rec_resp.status_code == 201
    rec_data = rec_resp.json()
    assert rec_data["title"] == "Clinical Lipid Barrier & Retinoid Protocol"
    assert rec_data["professional_name"] is not None

    # Patient retrieves their recommendations
    my_recs = client.get("/api/v1/recommendations/my", headers=p_headers)
    assert my_recs.status_code == 200
    recs_list = my_recs.json()
    assert len(recs_list) == 1
    assert recs_list[0]["title"] == "Clinical Lipid Barrier & Retinoid Protocol"
    assert "Ceramide NP" in recs_list[0]["prescribed_actives"]


def test_patient_inquiry_and_professional_chat_flow(client):
    # Register patient
    patient_token = register_and_get_token(client, email="inquiry_patient@example.com", role="USER")
    p_headers = {"Authorization": f"Bearer {patient_token}"}
    p_me = client.get("/api/v1/users/me", headers=p_headers).json()
    patient_id = p_me["id"]

    # Register dermatologist
    doc_token = register_and_get_token(client, email="inquiry_doc@example.com", role="DERMATOLOGIST")
    doc_headers = {"Authorization": f"Bearer {doc_token}"}
    doc_me = client.get("/api/v1/users/me", headers=doc_headers).json()
    doc_id = doc_me["id"]

    # Connect patient and dermatologist
    req_resp = client.post(
        "/api/v1/connections",
        headers=p_headers,
        json={"professional_id": str(doc_id)}
    )
    assert req_resp.status_code == 201
    conn_id = req_resp.json()["id"]

    # Dermatologist accepts connection
    acc_resp = client.patch(
        f"/api/v1/connections/{conn_id}/accept",
        headers=doc_headers,
    )
    assert acc_resp.status_code == 200

    # Patient sends inquiry
    inq_resp = client.post(
        "/api/v1/recommendations/inquiry",
        headers=p_headers,
        json={
            "professional_id": doc_id,
            "subject": "Flaking after starting tretinoin",
            "message": "Hello Dr., my skin is peeling around the chin after 3 days of tretinoin application."
        }
    )
    assert inq_resp.status_code == 201
    inq_data = inq_resp.json()
    assert inq_data["title"] == "[Patient Inquiry] Flaking after starting tretinoin"
    assert inq_data["patient_id"] == patient_id
    assert inq_data["professional_id"] == doc_id

    # Dermatologist views recommendations for patient
    doc_view = client.get(f"/api/v1/recommendations/patient/{patient_id}", headers=doc_headers)
    assert doc_view.status_code == 200
    assert len(doc_view.json()) == 1
    assert doc_view.json()[0]["clinical_notes"] == "Hello Dr., my skin is peeling around the chin after 3 days of tretinoin application."
