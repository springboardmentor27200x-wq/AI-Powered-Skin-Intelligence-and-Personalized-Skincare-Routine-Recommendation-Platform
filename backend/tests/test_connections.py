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

    # Seed reference skin concerns
    concerns = [
        SkinConcern(code="ACNE", name="Acne", description="Breakouts"),
        SkinConcern(code="DRY_SKIN", name="Dry Skin", description="Flaky skin"),
        SkinConcern(code="SENSITIVE_SKIN", name="Sensitive Skin", description="Reactive skin"),
    ]
    session.add_all(concerns)

    # Seed users
    user1 = User(
        email="testuser@example.com",
        hashed_password=hash_password("password123"),
        role="USER",
        is_active=True
    )
    user2 = User(
        email="unconnected_user@example.com",
        hashed_password=hash_password("password123"),
        role="USER",
        is_active=True
    )
    consultant1 = User(
        email="consultant1@example.com",
        hashed_password=hash_password("password123"),
        role="SKINCARE_CONSULTANT",
        is_active=True
    )
    consultant2 = User(
        email="consultant2@example.com",
        hashed_password=hash_password("password123"),
        role="SKINCARE_CONSULTANT",
        is_active=True
    )
    derm1 = User(
        email="derm1@example.com",
        hashed_password=hash_password("password123"),
        role="DERMATOLOGIST",
        is_active=True
    )
    admin = User(
        email="admin@example.com",
        hashed_password=hash_password("password123"),
        role="ADMINISTRATOR",
        is_active=True
    )

    session.add_all([user1, user2, consultant1, consultant2, derm1, admin])
    session.flush()

    # Add profiles
    session.add(UserProfile(user_id=user1.id, name="Test User", location="San Francisco, CA", age_group="25_34"))
    session.add(UserProfile(user_id=user2.id, name="Unconnected User", location="Chicago, IL", age_group="35_44"))
    session.add(UserProfile(user_id=consultant1.id, name="Clara Consultant", location="New York, NY"))
    session.add(UserProfile(user_id=consultant2.id, name="David Consultant", location="Austin, TX"))
    session.add(UserProfile(user_id=derm1.id, name="Dr. Dan", location="Boston, MA"))
    session.add(UserProfile(user_id=admin.id, name="Admin Arthur", location="HQ"))

    # Add skin profile for user1
    session.add(SkinProfile(user_id=user1.id, skin_type="COMBINATION", allergies="Fragrance"))
    session.add(SkinProfile(user_id=user2.id, skin_type="OILY", allergies="None"))

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


def get_token(client: TestClient, email: str, password: str = "password123") -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    return response.json()["access_token"]


# ─────────────────────────────────────────────────────────────
# TESTS
# ─────────────────────────────────────────────────────────────

def test_professionals_discovery(client):
    user_token = get_token(client, "testuser@example.com")
    headers = {"Authorization": f"Bearer {user_token}"}

    # Discover all professionals
    resp = client.get("/api/v1/professionals", headers=headers)
    assert resp.status_code == 200
    profs = resp.json()
    assert len(profs) == 3  # consultant1, consultant2, derm1
    assert any(p["name"] == "Clara Consultant" for p in profs)

    # Filter by role
    resp = client.get("/api/v1/professionals?role=DERMATOLOGIST", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "Dr. Dan"

    # Filter by search
    resp = client.get("/api/v1/professionals?search=David", headers=headers)
    assert resp.status_code == 200
    assert len(resp.json()) == 1
    assert resp.json()[0]["name"] == "David Consultant"


def test_user_cannot_connect_to_self_or_user_or_admin(client, db):
    user_token = get_token(client, "testuser@example.com")
    headers = {"Authorization": f"Bearer {user_token}"}

    user1 = db.query(User).filter(User.email == "testuser@example.com").first()
    user2 = db.query(User).filter(User.email == "unconnected_user@example.com").first()
    admin = db.query(User).filter(User.email == "admin@example.com").first()

    # Self connection
    resp = client.post("/api/v1/connections", json={"professional_id": str(user1.id)}, headers=headers)
    assert resp.status_code == 400

    # Connect to another USER role
    resp = client.post("/api/v1/connections", json={"professional_id": str(user2.id)}, headers=headers)
    assert resp.status_code == 400
    assert "must be a Skincare Consultant or Dermatologist" in resp.json()["detail"]

    # Connect to ADMINISTRATOR role
    resp = client.post("/api/v1/connections", json={"professional_id": str(admin.id)}, headers=headers)
    assert resp.status_code == 400


def test_connection_request_lifecycle(client, db):
    user_token = get_token(client, "testuser@example.com")
    consultant_token = get_token(client, "consultant1@example.com")
    user_headers = {"Authorization": f"Bearer {user_token}"}
    consultant_headers = {"Authorization": f"Bearer {consultant_token}"}

    consultant = db.query(User).filter(User.email == "consultant1@example.com").first()

    # 1. User sends connection request
    resp = client.post("/api/v1/connections", json={"professional_id": str(consultant.id)}, headers=user_headers)
    assert resp.status_code == 201
    conn_data = resp.json()
    assert conn_data["status"] == "PENDING"
    conn_id = conn_data["id"]

    # 2. Duplicate pending request should fail
    resp_dup = client.post("/api/v1/connections", json={"professional_id": str(consultant.id)}, headers=user_headers)
    assert resp_dup.status_code == 400

    # 3. Consultant views incoming requests
    req_resp = client.get("/api/v1/connections/requests", headers=consultant_headers)
    assert req_resp.status_code == 200
    assert len(req_resp.json()) == 1
    assert req_resp.json()[0]["id"] == conn_id

    # 4. Consultant accepts request
    accept_resp = client.patch(f"/api/v1/connections/{conn_id}/accept", headers=consultant_headers)
    assert accept_resp.status_code == 200
    assert accept_resp.json()["status"] == "ACCEPTED"

    # 5. User checks my connections
    my_resp = client.get("/api/v1/connections/my", headers=user_headers)
    assert my_resp.status_code == 200
    assert len(my_resp.json()) == 1
    assert my_resp.json()[0]["status"] == "ACCEPTED"

    # 6. Consultant accesses authorized client data
    client_list_resp = client.get("/api/v1/consultant/clients", headers=consultant_headers)
    assert client_list_resp.status_code == 200
    assert len(client_list_resp.json()) == 1
    client_user_id = client_list_resp.json()[0]["user_id"]

    client_detail_resp = client.get(f"/api/v1/consultant/clients/{client_user_id}", headers=consultant_headers)
    assert client_detail_resp.status_code == 200
    assert client_detail_resp.json()["skin_profile"]["skin_type"] == "COMBINATION"

    # 7. User disconnects
    cancel_resp = client.patch(f"/api/v1/connections/{conn_id}/cancel", headers=user_headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "CANCELLED"

    # 8. Consultant now loses access to client data (403 Forbidden)
    revoked_resp = client.get(f"/api/v1/consultant/clients/{client_user_id}", headers=consultant_headers)
    assert revoked_resp.status_code == 403


def test_security_isolation_unauthorized_access(client, db):
    """
    STRICT SECURITY TEST:
    - Consultant A cannot access client of Consultant B
    - Consultant cannot access unconnected user
    - Dermatologist cannot access consultant client
    """
    consultant1_token = get_token(client, "consultant1@example.com")
    consultant2_token = get_token(client, "consultant2@example.com")
    derm_token = get_token(client, "derm1@example.com")

    consultant1 = db.query(User).filter(User.email == "consultant1@example.com").first()
    user1 = db.query(User).filter(User.email == "testuser@example.com").first()
    user2 = db.query(User).filter(User.email == "unconnected_user@example.com").first()

    # Create accepted connection between user1 and consultant1
    conn = ProfessionalConnection(
        user_id=user1.id,
        professional_id=consultant1.id,
        professional_type="SKINCARE_CONSULTANT",
        status="ACCEPTED"
    )
    db.add(conn)
    db.commit()

    # Consultant 1 can access user1
    c1_headers = {"Authorization": f"Bearer {consultant1_token}"}
    r = client.get(f"/api/v1/consultant/clients/{user1.id}", headers=c1_headers)
    assert r.status_code == 200

    # Consultant 1 CANNOT access unconnected user2
    r_unconnected = client.get(f"/api/v1/consultant/clients/{user2.id}", headers=c1_headers)
    assert r_unconnected.status_code == 403

    # Consultant 2 CANNOT access user1 (who belongs to Consultant 1)
    c2_headers = {"Authorization": f"Bearer {consultant2_token}"}
    r_c2 = client.get(f"/api/v1/consultant/clients/{user1.id}", headers=c2_headers)
    assert r_c2.status_code == 403

    # Dermatologist CANNOT access user1 through dermatologist patient endpoint (no accepted derm connection)
    derm_headers = {"Authorization": f"Bearer {derm_token}"}
    r_derm = client.get(f"/api/v1/dermatologist/patients/{user1.id}", headers=derm_headers)
    assert r_derm.status_code == 403


def test_admin_governance_and_safeguards(client, db):
    admin_token = get_token(client, "admin@example.com")
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Fetch platform stats
    stats_resp = client.get("/api/v1/admin/stats", headers=admin_headers)
    assert stats_resp.status_code == 200
    assert stats_resp.json()["total_users"] == 6
    assert stats_resp.json()["consultants_count"] == 2

    # 2. List and search users
    users_resp = client.get("/api/v1/admin/users?role=SKINCARE_CONSULTANT", headers=admin_headers)
    assert users_resp.status_code == 200
    assert len(users_resp.json()) == 2

    # 3. Toggle user active status
    user1 = db.query(User).filter(User.email == "testuser@example.com").first()
    deact_resp = client.patch(f"/api/v1/admin/users/{user1.id}/status", json={"is_active": False}, headers=admin_headers)
    assert deact_resp.status_code == 200
    assert deact_resp.json()["is_active"] is False

    # 4. Safeguard: Admin cannot deactivate self
    admin_user = db.query(User).filter(User.email == "admin@example.com").first()
    self_deact_resp = client.patch(f"/api/v1/admin/users/{admin_user.id}/status", json={"is_active": False}, headers=admin_headers)
    assert self_deact_resp.status_code == 400
    assert "Security violation" in self_deact_resp.json()["detail"]

    # 5. System status
    sys_resp = client.get("/api/v1/admin/system-status", headers=admin_headers)
    assert sys_resp.status_code == 200
    assert sys_resp.json()["status"] == "Operational"
