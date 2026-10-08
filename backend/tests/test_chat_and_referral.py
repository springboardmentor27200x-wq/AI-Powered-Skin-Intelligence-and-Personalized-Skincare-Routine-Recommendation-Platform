import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.user import User, UserProfile
from app.models.connection import ProfessionalConnection
from app.models.chat import ChatMessage
from app.core.security import hash_password, create_access_token

# Setup in-memory SQLite database
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

    # Seed Patient
    patient = User(
        email="patient@example.com",
        hashed_password=hash_password("password123"),
        role="USER",
        is_active=True
    )
    session.add(patient)
    session.flush()
    session.add(UserProfile(user_id=patient.id, name="Alice Client", location="New York", age_group="25_34"))

    # Seed Consultant
    consultant = User(
        email="consultant@example.com",
        hashed_password=hash_password("password123"),
        role="SKINCARE_CONSULTANT",
        is_active=True
    )
    session.add(consultant)
    session.flush()
    session.add(UserProfile(user_id=consultant.id, name="Sarah Consultant", location="London"))

    # Seed Dermatologist
    derma = User(
        email="doctor@example.com",
        hashed_password=hash_password("password123"),
        role="DERMATOLOGIST",
        is_active=True
    )
    session.add(derma)
    session.flush()
    session.add(UserProfile(user_id=derma.id, name="Dr. Elena Rostova", location="Boston"))

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


def _get_headers(client: TestClient, db, email: str):
    user = db.query(User).filter_by(email=email).first()
    res = client.post("/api/v1/auth/login", data={"username": email, "password": "password123"})
    assert res.status_code == 200, res.text
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}, user


def test_care_circle_referral_and_whatsapp_chat(client, db):
    patient_headers, patient = _get_headers(client, db, "patient@example.com")
    consultant_headers, consultant = _get_headers(client, db, "consultant@example.com")
    derma_headers, derma = _get_headers(client, db, "doctor@example.com")

    # 1. Patient requests connection with Consultant
    conn_res = client.post("/api/v1/connections", json={
        "professional_id": str(consultant.id)
    }, headers=patient_headers)
    assert conn_res.status_code == 201
    conn_id = conn_res.json()["id"]

    # 2. Consultant accepts connection
    accept_res = client.patch(f"/api/v1/connections/{conn_id}/accept", headers=consultant_headers)
    assert accept_res.status_code == 200

    # 3. Consultant refers Dermatologist to Patient
    refer_res = client.post("/api/v1/connections/refer", json={
        "client_id": str(patient.id),
        "dermatologist_id": str(derma.id),
        "referral_notes": "Patient has persistent inflammatory papules requiring clinical retinoid guidance.",
        "priority": "HIGH_PRIORITY"
    }, headers=consultant_headers)
    assert refer_res.status_code == 201, refer_res.text
    ref_data = refer_res.json()
    assert ref_data["status"] == "ACCEPTED"
    assert ref_data["referred_by_id"] == str(consultant.id)
    assert ref_data["referred_by_name"] == "Sarah Consultant"
    assert ref_data["referral_priority"] == "HIGH_PRIORITY"

    # 4. Patient checks Care Circle (both professionals are connected!)
    circle_res = client.get("/api/v1/connections/care-circle", headers=patient_headers)
    assert circle_res.status_code == 200, circle_res.text
    circle = circle_res.json()
    assert circle["client_name"] == "Alice Client"
    assert circle["primary_consultant"]["name"] == "Sarah Consultant"
    assert circle["attending_dermatologist"]["name"] == "Dr. Elena Rostova"

    # 5. Check Notifications for Patient and Dermatologist
    patient_notifs = client.get("/api/v1/notifications", headers=patient_headers).json()["notifications"]
    assert any("Dr. Elena Rostova" in n["title"] or "Dr. Elena Rostova" in n["message"] for n in patient_notifs)

    derma_notifs = client.get("/api/v1/notifications", headers=derma_headers).json()["notifications"]
    assert any("Alice Client" in n["message"] for n in derma_notifs)

    # 6. Consultant checks client list (includes referral details)
    client_list_res = client.get("/api/v1/consultant/clients", headers=consultant_headers)
    assert client_list_res.status_code == 200
    clients = client_list_res.json()
    assert len(clients) == 1
    assert clients[0]["name"] == "Alice Client"

    # 7. Dermatologist checks patient list (shows patient referred by Sarah!)
    patients_res = client.get("/api/v1/dermatologist/patients", headers=derma_headers)
    assert patients_res.status_code == 200
    patients = patients_res.json()
    assert len(patients) == 1
    assert patients[0]["name"] == "Alice Client"
    assert patients[0]["referred_by_name"] == "Sarah Consultant"

    # 8. WhatsApp-style Chat: List Conversations
    convs_res = client.get("/api/v1/chat/conversations", headers=consultant_headers)
    assert convs_res.status_code == 200
    convs = convs_res.json()
    assert len(convs) >= 2
    partner_names = [c["partner_name"] for c in convs]
    assert "Alice Client" in partner_names
    assert "Dr. Elena Rostova" in partner_names

    # 9. Doctor messages Patient
    send_res = client.post(f"/api/v1/chat/{patient.id}/messages", json={
        "message": "Hello Alice, I have reviewed your case referred by Sarah.",
        "message_type": "TEXT"
    }, headers=derma_headers)
    assert send_res.status_code == 201
    msg = send_res.json()
    assert msg["sender_id"] == str(derma.id)
    assert msg["recipient_id"] == str(patient.id)
    assert msg["is_read"] is False

    # 10. Patient reads messages (auto marks as read)
    thread_res = client.get(f"/api/v1/chat/{derma.id}/messages", headers=patient_headers)
    assert thread_res.status_code == 200
    thread = thread_res.json()
    assert len(thread) >= 1
    assert thread[-1]["is_read"] is True

    # 11. Patient sends reply
    reply_res = client.post(f"/api/v1/chat/{derma.id}/messages", json={
        "message": "Thank you Dr. Rostova! Should I keep using my morning moisturizer?",
        "message_type": "TEXT"
    }, headers=patient_headers)
    assert reply_res.status_code == 201

    # 12. Quick clinical chips suggestions
    sugg_res = client.get("/api/v1/chat/suggestions", headers=derma_headers)
    assert sugg_res.status_code == 200
    chips = sugg_res.json()
    assert len(chips) >= 3
