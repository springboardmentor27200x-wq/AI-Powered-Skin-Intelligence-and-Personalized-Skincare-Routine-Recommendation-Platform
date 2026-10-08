import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.base import Base
from app.models.product import Product
from app.models.ingredient import Ingredient, IngredientInteraction
from app.db.seed_genuine_datasets import seed_genuine_datasets, GENUINE_PRODUCTS, GENUINE_INGREDIENTS

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
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)


def test_seed_genuine_datasets_execution(db):
    # 1. Run first time
    res = seed_genuine_datasets(db)
    assert res["ingredients"] >= 25
    assert res["products"] >= 50

    # 2. Verify all seeded products have INR currency
    products = db.query(Product).all()
    assert len(products) >= 50
    for p in products:
        assert p.currency == "INR"
        assert p.price is not None and p.price > 0
        assert p.category in {
            "FACE_WASH", "MOISTURIZER", "SUNSCREEN", "SERUM", "TONER", "TREATMENT", "FACE_MASK"
        }
        assert p.brand in {
            "CeraVe", "The Ordinary", "Minimalist", "La Roche-Posay",
            "Paula's Choice", "COSRX", "Cetaphil", "Bioderma", "Neutrogena",
            "Plum", "Dot & Key"
        }
        assert isinstance(p.ingredients, list)
        assert len(p.ingredients) > 0

    # 3. Verify ingredients and interactions
    ingredients = db.query(Ingredient).all()
    assert len(ingredients) >= 25
    interactions = db.query(IngredientInteraction).all()
    assert len(interactions) >= 4

    # Check for crucial interaction pairs
    avoid_interactions = [i for i in interactions if i.interaction_type == "AVOID"]
    assert len(avoid_interactions) > 0

    # 4. Run second time to verify idempotency (no duplicates added)
    res_second = seed_genuine_datasets(db)
    assert res_second["ingredients"] == 0
    assert res_second["products"] == 0
    assert db.query(Product).count() == len(products)
    assert db.query(Ingredient).count() == len(ingredients)
