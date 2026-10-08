import uuid
from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class Product(Base):
    """
    Product catalog entry.
    Comes from backend/database — never hardcoded in the frontend.
    """
    __tablename__ = "products"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(300), nullable=False, index=True)
    brand = Column(String(200), nullable=True)
    category = Column(String(100), nullable=False, index=True)
    # Categories: FACE_WASH, MOISTURIZER, SUNSCREEN, SERUM, TONER, TREATMENT, FACE_MASK

    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), default="INR", nullable=False)
    size = Column(String(50), nullable=True)         # e.g. "50ml", "30ml"
    product_url = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)

    # Ingredient data (normalized names for safety pipeline)
    ingredients = Column(JSON, nullable=True)         # List[str] full ingredient list (normalized)
    active_ingredients = Column(JSON, nullable=True)  # List[str] key actives

    # Suitability metadata (used by recommendation engine)
    skin_types = Column(JSON, nullable=True)          # List[str] compatible skin types
    target_concerns = Column(JSON, nullable=True)     # List[str] concern codes this product addresses
    sensitivity_flags = Column(JSON, nullable=True)   # List[str] known sensitivity triggers

    # BUDGET | MODERATE | PREMIUM
    budget_band = Column(String(20), nullable=False, default="MODERATE")

    is_available = Column(Boolean, default=True, nullable=False)
    is_seed_data = Column(Boolean, default=False, nullable=False)  # Distinguishes seed from production data

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class ProductRecommendation(Base):
    """
    Audit trail for product recommendations generated for a user.
    Stores why a product was recommended or excluded — for explainability and admin monitoring.
    Safety exclusions (ALLERGEN_CONFLICT) are stored and surfaced.
    """
    __tablename__ = "product_recommendations"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Uuid, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(Uuid, ForeignKey("skin_assessments.id", ondelete="SET NULL"), nullable=True, index=True)

    # RECOMMENDED | EXCLUDED | ALTERNATIVE
    recommendation_status = Column(String(30), nullable=False, default="RECOMMENDED")

    match_score = Column(Integer, nullable=True)           # 0-100 "Profile Match"
    reasons = Column(JSON, nullable=True)                  # List[str] user-friendly why-reasons
    safety_status = Column(String(50), nullable=True)      # SAFE | ALLERGEN_CONFLICT | CAUTION
    exclusion_reason = Column(String(100), nullable=True)  # ALLERGEN_CONFLICT | SENSITIVITY | INTERACTION
    profile_factors = Column(JSON, nullable=True)          # skin type, concerns used
    ingredient_factors = Column(JSON, nullable=True)       # key active ingredients matched
    budget_band = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    user = relationship("User")
    product = relationship("Product")
