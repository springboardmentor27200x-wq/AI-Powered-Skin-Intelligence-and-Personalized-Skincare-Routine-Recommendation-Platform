import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.user import User, UserProfile
from app.models.skin_profile import SkinConcern, SkinProfile
from app.models.connection import ProfessionalConnection
from app.core.security import hash_password

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

    # Seed reference concerns
    acne = SkinConcern(code="ACNE", name="Acne", description="Breakouts")
    dry = SkinConcern(code="DRY_SKIN", name="Dry Skin", description="Flakiness")
    session.add_all([acne, dry])

    # Seed platform user
    user = User(
        email="patient_jane@example.com",
        hashed_password=hash_password("password123"),
        role="USER",
        is_active=True
    )
    user.profile = UserProfile(name="Jane Doe", age_group="25-34", location="San Francisco, CA")
    session.add(user)
    session.flush()

    # Add skin profile for user
    skin_prof = SkinProfile(
        user_id=user.id,
        skin_type="COMBINATION",
        allergies="Fragrance",
    )
    skin_prof.concerns.append(acne)
    session.add(skin_prof)

    # Seed Skincare Consultant
    consultant = User(
        email="consultant_sarah@example.com",
        hashed_password=hash_password("password123"),
        role="SKINCARE_CONSULTANT",
        is_active=True
    )
    consultant.profile = UserProfile(name="Sarah Jenkins", age_group="35-44", location="Los Angeles, CA")
    session.add(consultant)

    # Seed Dermatologist
    dermatologist = User(
        email="dr_dan@example.com",
        hashed_password=hash_password("password123"),
        role="DERMATOLOGIST",
        is_active=True
    )
    dermatologist.profile = UserProfile(name="Dr. Dan Miller", age_group="45-54", location="New York, NY")
    session.add(dermatologist)

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


def get_token(client, email):
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"}
    )
    return res.json()["access_token"]


def test_consultant_directory_and_approach(client, db):
    consultant_token = get_token(client, "consultant_sarah@example.com")
    headers = {"Authorization": f"Bearer {consultant_token}"}

    # 1. Consultant lists all platform users
    resp = client.get("/api/v1/consultant/all-users", headers=headers)
    assert resp.status_code == 200
    users = resp.json()
    assert len(users) == 1
    jane = users[0]
    assert jane["name"] == "Jane Doe"
    assert jane["email"] == "patient_jane@example.com"
    assert jane["skin_type"] == "COMBINATION"
    assert "Acne" in jane["concerns"]
    assert jane["connection_status"] == "NOT_CONNECTED"

    # 2. Consultant inspects user Jane's full skin dossier before approach
    inspect_resp = client.get(f"/api/v1/consultant/inspect-user/{jane['user_id']}", headers=headers)
    assert inspect_resp.status_code == 200
    dossier = inspect_resp.json()
    assert dossier["skin_profile"]["skin_type"] == "COMBINATION"
    assert dossier["skin_profile"]["allergies"] == "Fragrance"
    assert len(dossier["concerns"]) == 1
    assert dossier["concerns"][0]["name"] == "Acne"

    # 3. Consultant approaches user Jane with a custom intro message
    custom_msg = "Hello Jane! I noticed your acne concerns and would love to help optimize your routine."
    approach_resp = client.post(
        "/api/v1/consultant/approach-user",
        headers=headers,
        json={"user_id": jane["user_id"], "intro_message": custom_msg}
    )
    assert approach_resp.status_code == 200
    conn = approach_resp.json()
    # It must NOT directly connect; it creates a PENDING request
    assert conn["status"] == "PENDING"
    assert conn["professional_type"] == "SKINCARE_CONSULTANT"
    assert conn["referral_notes"] == custom_msg
    conn_id = conn["id"]

    # 4. Consultant lists all users again - status is now PENDING
    resp2 = client.get("/api/v1/consultant/all-users", headers=headers)
    assert resp2.status_code == 200
    assert resp2.json()[0]["connection_status"] == "PENDING"

    # 5. Patient Jane logs in, verifies notification was received with consultant's role and message
    jane_token = get_token(client, "patient_jane@example.com")
    jane_headers = {"Authorization": f"Bearer {jane_token}"}
    notif_resp = client.get("/api/v1/notifications", headers=jane_headers)
    assert notif_resp.status_code == 200
    notifs = notif_resp.json().get("notifications", [])
    assert len(notifs) >= 1
    matching_notif = next((n for n in notifs if "Sarah Jenkins" in n["title"]), None)
    assert matching_notif is not None
    assert "Skincare Consultant" in matching_notif["title"]
    assert custom_msg in matching_notif["message"]

    # 6. Patient Jane reviews incoming request and accepts it
    reqs_resp = client.get("/api/v1/connections/requests", headers=jane_headers)
    assert reqs_resp.status_code == 200
    assert len(reqs_resp.json()) == 1
    assert reqs_resp.json()[0]["referral_notes"] == custom_msg

    accept_resp = client.patch(f"/api/v1/connections/{conn_id}/accept", headers=jane_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"


def test_dermatologist_directory_and_approach(client, db):
    derm_token = get_token(client, "dr_dan@example.com")
    headers = {"Authorization": f"Bearer {derm_token}"}

    # 1. Dermatologist lists all platform users
    resp_users = client.get("/api/v1/dermatologist/all-users", headers=headers)
    assert resp_users.status_code == 200
    users = resp_users.json()
    assert len(users) == 1
    jane = users[0]
    assert jane["name"] == "Jane Doe"
    assert jane["connection_status"] == "NOT_CONNECTED"

    # 2. Dermatologist inspects patient Jane's dossier
    inspect_resp = client.get(f"/api/v1/dermatologist/inspect-user/{jane['user_id']}", headers=headers)
    assert inspect_resp.status_code == 200
    dossier = inspect_resp.json()
    assert dossier["skin_profile"]["skin_type"] == "COMBINATION"
    assert dossier["skin_profile"]["allergies"] == "Fragrance"

    # 3. Dermatologist lists all consultants
    resp_consultants = client.get("/api/v1/dermatologist/all-consultants", headers=headers)
    assert resp_consultants.status_code == 200
    consultants = resp_consultants.json()
    assert len(consultants) == 1
    sarah = consultants[0]
    assert sarah["name"] == "Sarah Jenkins"
    assert sarah["collaboration_status"] == "AVAILABLE"

    # 4. Dermatologist approaches patient Jane
    derma_patient_msg = "Hello Jane! I am Dr. Dan Miller, dermatologist. Let's clinically address your breakouts."
    approach_user_resp = client.post(
        "/api/v1/dermatologist/approach-user",
        headers=headers,
        json={"user_id": jane["user_id"], "intro_message": derma_patient_msg}
    )
    assert approach_user_resp.status_code == 200
    conn_user = approach_user_resp.json()
    # It must NOT directly connect; it creates a PENDING request
    assert conn_user["status"] == "PENDING"
    assert conn_user["professional_type"] == "DERMATOLOGIST"
    assert conn_user["referral_notes"] == derma_patient_msg

    # 5. Dermatologist approaches consultant Sarah for care circle collaboration
    derma_colleague_msg = "Hello Sarah! Let's collaborate on mutual patient referrals."
    approach_consultant_resp = client.post(
        "/api/v1/dermatologist/approach-consultant",
        headers=headers,
        json={"consultant_id": sarah["user_id"], "intro_message": derma_colleague_msg}
    )
    assert approach_consultant_resp.status_code == 200
    collab_data = approach_consultant_resp.json()
    assert collab_data["success"] is True
    assert collab_data["status"] == "PENDING"
    assert "Sarah Jenkins" in collab_data["message"]

    # 6. Consultant Sarah logs in, sees notification and incoming connection request from Dr. Dan Miller
    sarah_token = get_token(client, "consultant_sarah@example.com")
    sarah_headers = {"Authorization": f"Bearer {sarah_token}"}
    sarah_notifs = client.get("/api/v1/notifications", headers=sarah_headers).json().get("notifications", [])
    sarah_matching_notif = next((n for n in sarah_notifs if "Dr. Dan Miller" in n["title"]), None)
    assert sarah_matching_notif is not None
    assert "Dermatologist" in sarah_matching_notif["title"]
    assert derma_colleague_msg in sarah_matching_notif["message"]

    # Consultant accepts colleague connection request
    sarah_reqs = client.get("/api/v1/connections/requests", headers=sarah_headers).json()
    assert len(sarah_reqs) == 1
    sarah_accept = client.patch(f"/api/v1/connections/{sarah_reqs[0]['id']}/accept", headers=sarah_headers)
    assert sarah_accept.status_code == 200
    assert sarah_accept.json()["status"] == "ACCEPTED"
