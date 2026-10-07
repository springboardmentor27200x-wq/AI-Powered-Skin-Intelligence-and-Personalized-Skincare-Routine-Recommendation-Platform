import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, get_db
from sqlalchemy.orm import sessionmaker
from models.user import User, UserRole

# Setup test db
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    # Keep data for manual inspection, normally drop_all()

def test_admin_stats_unauthorized():
    """Verify standard users cannot access admin routes."""
    response = client.get("/api/admin/stats")
    assert response.status_code == 401

def test_reports_pdf_unauthorized():
    """Verify unauthorized users cannot access reports."""
    response = client.get("/api/reports/assessment/pdf")
    assert response.status_code == 401
