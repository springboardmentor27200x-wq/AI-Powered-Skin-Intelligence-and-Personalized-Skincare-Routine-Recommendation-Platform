import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.main import app
from app.db.database import get_db
from app.db.base import Base
from app.models.product import Product

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
    products = [
        Product(
            name="Hydrating Cleanser",
            brand="Cerave",
            category="FACE_WASH",
            price=1199.0,
            currency="INR",
            budget_band="BUDGET",
            ingredients=["water", "glycerin", "ceramides"],
            active_ingredients=["ceramides"],
            skin_types=["DRY", "NORMAL"],
            target_concerns=["DRYNESS"],
            is_available=True,
        ),
        Product(
            name="Foaming Cleanser",
            brand="Cetaphil",
            category="FACE_WASH",
            price=1499.0,
            currency="INR",
            budget_band="MODERATE",
            ingredients=["water", "glycerin", "niacinamide"],
            active_ingredients=["niacinamide"],
            skin_types=["OILY", "COMBINATION"],
            target_concerns=["ACNE"],
            is_available=True,
        ),
        Product(
            name="Gentle Gel Cleanser",
            brand="La Roche-Posay",
            category="FACE_WASH",
            price=1799.0,
            currency="INR",
            budget_band="MODERATE",
            ingredients=["water", "zinc pca", "thermal spring water"],
            active_ingredients=["zinc pca"],
            skin_types=["OILY", "SENSITIVE"],
            target_concerns=["ACNE"],
            is_available=True,
        ),
    ]
    session.add_all(products)
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
    login_res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": "password123"}
    )
    return login_res.json()["access_token"]


def test_products_currency_inr_and_compare(client, db):
    token = register_and_get_token(client, "inruser@example.com")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. List products and check INR currency
    list_res = client.get("/api/v1/products", headers=headers)
    assert list_res.status_code == 200
    products = list_res.json()
    assert len(products) == 3
    for p in products:
        assert p["currency"] == "INR"
        assert p["price"] >= 1000

    # 2. Compare products
    prod_ids = [p["id"] for p in products[:2]]
    compare_res = client.post(
        "/api/v1/products/compare",
        json={"product_ids": prod_ids},
        headers=headers,
    )
    assert compare_res.status_code == 200
    comp_data = compare_res.json()
    assert len(comp_data["products"]) == 2
    for item in comp_data["products"]:
        assert item["product"]["currency"] == "INR"
        assert item["product"]["id"] in prod_ids

    # 3. Alternatives for first product
    alt_res = client.get(
        f"/api/v1/products/{prod_ids[0]}/alternatives",
        headers=headers,
    )
    assert alt_res.status_code == 200
    alts = alt_res.json()
    assert len(alts) >= 1
    for alt in alts:
        assert alt["product"]["id"] != prod_ids[0]
        assert alt["product"]["currency"] == "INR"
