import uuid
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, JSON, func
from sqlalchemy.orm import relationship
from sqlalchemy.types import Uuid
from app.db.database import Base


class Ingredient(Base):
    """
    Canonical ingredient knowledge base entry.
    Covers the 8 spec-defined categories + supports future additions.
    """
    __tablename__ = "ingredients"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, unique=True, index=True)
    normalized_name = Column(String(200), nullable=False, index=True)  # lowercase, stripped
    category = Column(String(100), nullable=False, index=True)
    # Categories: RETINOIDS, NIACINAMIDE, VITAMIN_C, HYALURONIC_ACID,
    #             SALICYLIC_ACID, CERAMIDES, PEPTIDES, AHAS_BHAS, OTHER

    description = Column(Text, nullable=True)
    common_uses = Column(Text, nullable=True)          # Plain-language use summary
    suitability_notes = Column(Text, nullable=True)    # Who may benefit / who should be cautious
    caution_notes = Column(Text, nullable=True)        # Known caution/sensitivity information
    education_content = Column(Text, nullable=True)    # Detailed educational paragraph
    aliases = Column(JSON, nullable=True)              # List[str] alternative names

    # Skin type compatibility flags (for suitability engine)
    suitable_for = Column(JSON, nullable=True)         # List[str] e.g. ["DRY", "NORMAL"]
    caution_for = Column(JSON, nullable=True)          # List[str] e.g. ["SENSITIVE"]
    avoid_for = Column(JSON, nullable=True)            # List[str] e.g. []

    # Concern relevance (maps to AssessmentConcern.concern_name)
    target_concerns = Column(JSON, nullable=True)      # List[str] e.g. ["ACNE", "HYPERPIGMENTATION"]

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    interactions_a = relationship(
        "IngredientInteraction",
        foreign_keys="[IngredientInteraction.ingredient_a_id]",
        back_populates="ingredient_a",
        cascade="all, delete-orphan",
    )
    interactions_b = relationship(
        "IngredientInteraction",
        foreign_keys="[IngredientInteraction.ingredient_b_id]",
        back_populates="ingredient_b",
        cascade="all, delete-orphan",
    )


class IngredientInteraction(Base):
    """
    Interaction rules between two ingredients.
    Supports: CAUTION, AVOID, SEQUENCE (use in order), SEPARATE (morning/evening).
    Safety-critical: displayed to users and used in product recommendation pipeline.
    """
    __tablename__ = "ingredient_interactions"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    ingredient_a_id = Column(Uuid, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_b_id = Column(Uuid, ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False, index=True)

    # CAUTION | AVOID | SEQUENCE | SEPARATE | SYNERGY
    interaction_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="MODERATE")  # LOW | MODERATE | HIGH
    recommendation = Column(Text, nullable=False)   # User-friendly advice
    description = Column(Text, nullable=True)        # Technical description

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationships
    ingredient_a = relationship("Ingredient", foreign_keys=[ingredient_a_id], back_populates="interactions_a")
    ingredient_b = relationship("Ingredient", foreign_keys=[ingredient_b_id], back_populates="interactions_b")
