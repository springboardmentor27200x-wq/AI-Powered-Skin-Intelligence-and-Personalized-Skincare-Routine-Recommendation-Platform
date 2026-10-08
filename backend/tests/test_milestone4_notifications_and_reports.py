import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.user import User
from app.models.connection import ProfessionalConnection
from app.models.notification import Notification, NotificationPreference, NotificationCategory, NotificationPriority
from app.models.report import ReportRecord, ReportType, ExportFormat
from app.services.intelligence import summary_engine

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
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
        },
    )
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"},
    )
    return login_res.json()["access_token"]


def test_notifications_crud_and_preferences(client, db):
    token = register_and_get_token(client, "notif_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Fetch initial notifications (empty)
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "notifications" in data
    assert "unread_count" in data

    # 2. Get preferences
    pref_res = client.get("/api/v1/notifications/preferences", headers=headers)
    assert pref_res.status_code == 200
    pref_data = pref_res.json()
    assert pref_data["routine_reminders"] is True

    # 3. Update preferences
    up_res = client.put(
        "/api/v1/notifications/preferences",
        headers=headers,
        json={"hydration_reminders": False, "morning_time": "08:00"},
    )
    assert up_res.status_code == 200
    assert up_res.json()["hydration_reminders"] is False
    assert up_res.json()["morning_time"] == "08:00"

    # 4. Trigger reminder sync
    sync_res = client.post("/api/v1/notifications/sync", headers=headers)
    assert sync_res.status_code == 200
    assert "generated" in sync_res.json()


def test_reports_ai_status(client):
    res = client.get("/api/v1/reports/ai-status")
    assert res.status_code == 200
    data = res.json()
    assert "active_provider" in data
    assert "providers" in data
    assert "deterministic" in data["providers"]


def test_reports_preview_and_exports(client, db):
    token = register_and_get_token(client, "report_user@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Preview report
    prev_res = client.get("/api/v1/reports/preview?report_type=SKIN_ASSESSMENT", headers=headers)
    assert prev_res.status_code == 200
    preview = prev_res.json()
    assert "title" in preview
    assert "overall_score" in preview
    assert "disclaimer" in preview
    assert "MEDICAL DISCLAIMER" in preview["disclaimer"]

    # 2. Export PDF
    pdf_res = client.get("/api/v1/reports/export/pdf?report_type=SKIN_ASSESSMENT", headers=headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert pdf_res.content.startswith(b"%PDF")

    # 3. Export Excel
    excel_res = client.get("/api/v1/reports/export/excel?report_type=SKIN_ASSESSMENT", headers=headers)
    assert excel_res.status_code == 200
    assert "spreadsheetml" in excel_res.headers["content-type"]
    assert len(excel_res.content) > 100

    # 4. Audit History
    hist_res = client.get("/api/v1/reports/history", headers=headers)
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert hist["total"] >= 2  # 1 PDF + 1 Excel recorded


def test_reports_rbac_security(client, db):
    user_token = register_and_get_token(client, "patient1@example.com", "USER")
    stranger_token = register_and_get_token(client, "stranger@example.com", "USER")
    admin_token = register_and_get_token(client, "admin1@example.com", "USER")

    # Elevate admin1 to ADMINISTRATOR in the test db session
    admin_user = db.query(User).filter(User.email == "admin1@example.com").first()
    admin_user.role = "ADMINISTRATOR"
    db.commit()

    user_headers = {"Authorization": f"Bearer {user_token}"}
    stranger_headers = {"Authorization": f"Bearer {stranger_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Get patient1 user_id
    me = client.get("/api/v1/users/me", headers=user_headers).json()
    patient_id = me["id"]

    # 1. Stranger trying to preview patient1's report -> 403 Forbidden
    forbidden_res = client.get(
        f"/api/v1/reports/preview?target_user_id={patient_id}",
        headers=stranger_headers,
    )
    assert forbidden_res.status_code == 403

    # 2. Admin previewing patient1's report -> 200 OK
    admin_res = client.get(
        f"/api/v1/reports/preview?target_user_id={patient_id}",
        headers=admin_headers,
    )
    assert admin_res.status_code == 200
    assert admin_res.json()["user_email"] == "patient1@example.com"


def test_summary_engine_rule_fallback():
    import asyncio
    ctx = {
        "scores": {"overall_score": 75, "barrier_score": 70, "hydration_score": 65},
        "concerns": [{"name": "Acne", "severity": "HIGH"}],
        "sleep": {"avg_hours": 7.0},
        "hydration": {"avg_daily_ml": 2000},
    }
    summary = asyncio.run(summary_engine.generate_assessment_summary(ctx))
    assert "DermaIQ Clinical Assessment Summary" in summary
    assert "AI-generated skincare insight" in summary

