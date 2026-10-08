import sys
import os
from datetime import datetime, timezone
import pytest
import mongomock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
settings.SEED_DEMO_DATA = False

from fastapi.testclient import TestClient
from app.db.session import get_db, ensure_indexes
from app.main import app
from app.models.user import UserRole
from app.core.security import create_access_token, hash_password

@pytest.fixture(scope="function")
def db_session():
    client = mongomock.MongoClient()
    db = client["skincare_db_test"]
    ensure_indexes(db)
    yield db
    client.drop_database("skincare_db_test")

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def test_user(db_session):
    now = datetime.now(timezone.utc)
    user_doc = {
        "id": 1,
        "email": "testuser@skiniq.ai",
        "hashed_password": hash_password("Password123!"),
        "full_name": "Test User",
        "role": UserRole.USER.value,
        "is_active": True,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now
    }
    db_session["users"].insert_one(user_doc)
    return user_doc

@pytest.fixture
def test_admin(db_session):
    now = datetime.now(timezone.utc)
    admin_doc = {
        "id": 2,
        "email": "admin@skiniq.ai",
        "hashed_password": hash_password("AdminPass123!"),
        "full_name": "Admin User",
        "role": UserRole.ADMINISTRATOR.value,
        "is_active": True,
        "avatar_url": None,
        "created_at": now,
        "updated_at": now
    }
    db_session["users"].insert_one(admin_doc)
    return admin_doc

@pytest.fixture
def user_auth_headers(test_user):
    token = create_access_token(subject=test_user["id"], role=test_user["role"])
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def admin_auth_headers(test_admin):
    token = create_access_token(subject=test_admin["id"], role=test_admin["role"])
    return {"Authorization": f"Bearer {token}"}
