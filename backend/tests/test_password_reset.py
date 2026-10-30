import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.user import User, UserProfile
from app.models.password_reset import PasswordResetOTP
from app.core.security import hash_password, verify_password

# In-memory SQLite for self-contained testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def test_db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()

    # Seed test user
    user = User(
        email="testuser@example.com",
        hashed_password=hash_password("InitialPassword123!"),
        role="USER",
        auth_provider="local",
        is_active=True,
        is_verified=True
    )
    session.add(user)
    session.flush()

    profile = UserProfile(
        user_id=user.id,
        name="Test User"
    )
    session.add(profile)
    session.commit()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
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


def test_forgot_password_unknown_email(client):
    """Should return 404 if email does not exist."""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "nonexistent@example.com"})
    assert res.status_code == 404
    assert "No account found" in res.json()["detail"]


def test_forgot_password_success(client, test_db):
    """Should return 200 and success message for registered user, recording OTP in DB."""
    res = client.post("/api/v1/auth/forgot-password", json={"email": "testuser@example.com"})
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "verification code has been sent" in data["message"]

    otp_rec = test_db.query(PasswordResetOTP).filter_by(email="testuser@example.com").first()
    assert otp_rec is not None
    assert len(otp_rec.otp_code) == 6
    assert otp_rec.otp_code.isdigit()


def test_verify_otp_invalid(client):
    """Should reject invalid OTP code."""
    # First request OTP
    res_req = client.post("/api/v1/auth/forgot-password", json={"email": "testuser@example.com"})
    assert res_req.status_code == 200

    # Verify with wrong OTP
    res_ver = client.post("/api/v1/auth/verify-otp", json={
        "email": "testuser@example.com",
        "otp": "000000"
    })
    assert res_ver.status_code == 400
    assert "Invalid verification code" in res_ver.json()["detail"]


def test_verify_otp_success(client, test_db):
    """Should accept correct OTP code."""
    res_req = client.post("/api/v1/auth/forgot-password", json={"email": "testuser@example.com"})
    assert res_req.status_code == 200
    otp_rec = test_db.query(PasswordResetOTP).filter_by(email="testuser@example.com").order_by(PasswordResetOTP.created_at.desc()).first()
    assert otp_rec is not None

    res_ver = client.post("/api/v1/auth/verify-otp", json={
        "email": "testuser@example.com",
        "otp": otp_rec.otp_code
    })
    assert res_ver.status_code == 200
    assert res_ver.json()["success"] is True


def test_reset_password_mismatched_confirmation(client, test_db):
    """Should reject password reset when confirm_password does not match."""
    res_req = client.post("/api/v1/auth/forgot-password", json={"email": "testuser@example.com"})
    assert res_req.status_code == 200
    otp_rec = test_db.query(PasswordResetOTP).filter_by(email="testuser@example.com").order_by(PasswordResetOTP.created_at.desc()).first()
    assert otp_rec is not None

    res_reset = client.post("/api/v1/auth/reset-password", json={
        "email": "testuser@example.com",
        "otp": otp_rec.otp_code,
        "new_password": "NewSecretPassword123!",
        "confirm_password": "DifferentPassword123!"
    })
    assert res_reset.status_code == 400
    assert "do not match" in res_reset.json()["detail"]


def test_full_password_reset_flow_and_login(client, test_db):
    """Complete end-to-end test: Request OTP -> Reset Password -> Sign in with new credentials."""
    # 1. Request OTP
    res_req = client.post("/api/v1/auth/forgot-password", json={"email": "testuser@example.com"})
    assert res_req.status_code == 200
    otp_rec = test_db.query(PasswordResetOTP).filter_by(email="testuser@example.com").order_by(PasswordResetOTP.created_at.desc()).first()
    assert otp_rec is not None

    # 2. Reset Password
    new_password = "BrandNewSuperSecret2026!"
    res_reset = client.post("/api/v1/auth/reset-password", json={
        "email": "testuser@example.com",
        "otp": otp_rec.otp_code,
        "new_password": new_password,
        "confirm_password": new_password
    })
    assert res_reset.status_code == 200
    assert res_reset.json()["success"] is True
    assert "successfully updated" in res_reset.json()["message"]

    # 3. Old password should fail
    login_old = client.post("/api/v1/auth/login", data={
        "username": "testuser@example.com",
        "password": "InitialPassword123!"
    })
    assert login_old.status_code == 401

    # 4. New password should succeed and return JWT
    login_new = client.post("/api/v1/auth/login", data={
        "username": "testuser@example.com",
        "password": new_password
    })
    assert login_new.status_code == 200
    assert "access_token" in login_new.json()
    assert login_new.json()["token_type"] == "bearer"

    # 5. Re-using the same OTP should fail
    res_reuse = client.post("/api/v1/auth/reset-password", json={
        "email": "testuser@example.com",
        "otp": otp_rec.otp_code,
        "new_password": "YetAnotherPassword123!",
        "confirm_password": "YetAnotherPassword123!"
    })
    assert res_reuse.status_code == 400
