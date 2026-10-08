import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.skin_profile import SkinConcern
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
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    
    # Seed concerns for testing
    concerns = [
        SkinConcern(code="ACNE", name="Acne", description="Breakouts"),
        SkinConcern(code="DRY_SKIN", name="Dry Skin", description="Flaky skin"),
        SkinConcern(code="WRINKLES", name="Wrinkles", description="Fine lines")
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


# --- Authentication & User Tests ---

def test_register_success(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "testuser@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "full_name": "Test User"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "testuser@example.com"
    assert data["role"] == "USER"
    assert data["profile"]["name"] == "Test User"


def test_register_duplicate_fails(client):
    # Register first time
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password123",
            "confirm_password": "password123",
            "full_name": "First User"
        }
    )
    # Register second time
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "duplicate@example.com",
            "password": "password456",
            "confirm_password": "password456",
            "full_name": "Second User"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_login_success(client):
    # Register user
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "login@example.com",
            "password": "secretpassword",
            "confirm_password": "secretpassword",
            "full_name": "Login User"
        }
    )
    # Login
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "login@example.com",
            "password": "secretpassword"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_password_fails(client):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": "wrongpwd@example.com",
            "password": "secretpassword",
            "confirm_password": "secretpassword",
            "full_name": "Wrong Password User"
        }
    )
    response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "wrongpwd@example.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401


def test_protected_endpoint_rejects_unauthenticated(client):
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401


# --- Skin Profile Tests ---

def get_auth_headers(client, email="profile@example.com", password="password123"):
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": password,
            "confirm_password": password,
            "full_name": "Profile User"
        }
    )
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password}
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_skin_profile_crud(client):
    headers = get_auth_headers(client)
    
    # 1. Read before create (should be 404)
    get_resp = client.get("/api/v1/skin-profile/me", headers=headers)
    assert get_resp.status_code == 404
    
    # 2. Create skin profile
    create_resp = client.post(
        "/api/v1/skin-profile",
        headers=headers,
        json={
            "skin_type": "COMBINATION",
            "allergies": "Peanuts",
            "sensitivities": "Fragrance",
            "concerns": ["ACNE", "DRY_SKIN"]
        }
    )
    assert create_resp.status_code == 201
    data = create_resp.json()
    assert data["skin_type"] == "COMBINATION"
    assert data["allergies"] == "Peanuts"
    # Acne resolved, Dry skin resolved
    assert len(data["concerns"]) == 2
    assert {c["code"] for c in data["concerns"]} == {"ACNE", "DRY_SKIN"}

    # 3. Read after create
    get_resp = client.get("/api/v1/skin-profile/me", headers=headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["skin_type"] == "COMBINATION"

    # 4. Patch skin profile
    patch_resp = client.patch(
        "/api/v1/skin-profile/me",
        headers=headers,
        json={
            "skin_type": "DRY",
            "concerns": ["WRINKLES"]
        }
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["skin_type"] == "DRY"
    assert patch_resp.json()["concerns"][0]["code"] == "WRINKLES"


# --- Lifestyle Tracking Tests ---

def test_lifestyle_tracking_crud(client):
    headers = get_auth_headers(client, email="lifestyle@example.com")

    # 1. Create record
    create_resp = client.post(
        "/api/v1/lifestyle",
        headers=headers,
        json={
            "physical_activity": "ACTIVE",
            "smoking": "NONE",
            "alcohol": "NONE",
            "stress_level": 5,
            "record_date": "2026-08-25"
        }
    )
    assert create_resp.status_code == 201
    record_id = create_resp.json()["id"]

    # 2. Prevent duplicates for same date
    dup_resp = client.post(
        "/api/v1/lifestyle",
        headers=headers,
        json={
            "physical_activity": "MODERATE",
            "record_date": "2026-08-25"
        }
    )
    assert dup_resp.status_code == 400

    # 3. Fetch records
    get_resp = client.get("/api/v1/lifestyle", headers=headers)
    assert get_resp.status_code == 200
    assert len(get_resp.json()) == 1

    # 4. Update record
    patch_resp = client.patch(
        f"/api/v1/lifestyle/{record_id}",
        headers=headers,
        json={"stress_level": 7}
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["stress_level"] == 7

    # 5. Delete record
    del_resp = client.delete(f"/api/v1/lifestyle/{record_id}", headers=headers)
    assert del_resp.status_code == 204
