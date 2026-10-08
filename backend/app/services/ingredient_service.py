"""
Ingredient Intelligence Service — Module 5
==========================================
Implements:
- Ingredient search / lookup
- Suitability evaluation against user's skin profile
- Interaction checking (batch)
- Interaction seed utility (runs once on startup if interactions table is empty)
"""
from __future__ import annotations

import uuid
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.models.ingredient import Ingredient, IngredientInteraction
from app.models.skin_profile import SkinProfile
from app.models.assessment import SkinAssessment, AssessmentConcern
from app.schemas.ingredient import (
    IngredientBrief,
    IngredientDetailOut,
    SuitabilityResult,
    InteractionResult,
    InteractionCheckResponse,
)


# ─── Canonical interaction rules ─────────────────────────────────────────────
# These are used to seed the DB once on startup.
# Stored as (name_a, name_b, type, severity, recommendation, description)
_INTERACTION_SEED = [
    (
        "Retinol", "AHAs / BHAs",
        "CAUTION", "HIGH",
        "Avoid using both in the same routine step. If using both, apply on alternate evenings or separate into different times.",
        "Combining retinol with AHAs/BHAs can increase irritation risk. Both are potent actives — sequencing or alternating is generally recommended.",
    ),
    (
        "Vitamin C", "AHAs / BHAs",
        "SEQUENCE", "MODERATE",
        "Apply Vitamin C first (AM), AHAs/BHAs at a separate step or in the PM routine to reduce potential irritation.",
        "Both ingredients have low pH requirements that may compete. Applying them at different times may reduce irritation.",
    ),
    (
        "Retinol", "Vitamin C",
        "SEPARATE", "MODERATE",
        "Use Vitamin C in the morning and retinol in the evening to maximise effectiveness and reduce irritation potential.",
        "Vitamin C (L-Ascorbic Acid) and retinol may both be less effective or more irritating when combined. Separate AM/PM use is generally recommended.",
    ),
    (
        "Niacinamide", "Vitamin C",
        "CAUTION", "LOW",
        "At standard skincare concentrations these may be used together, but some formulations may cause mild flushing in some individuals. Patch test recommended.",
        "Older research flagged a potential interaction, but at typical skincare concentrations (under 20%) most individuals tolerate the combination. Monitor for flushing.",
    ),
    (
        "Salicylic Acid", "AHAs / BHAs",
        "CAUTION", "MODERATE",
        "Avoid stacking multiple exfoliating acids in the same routine step. Over-exfoliation can disrupt the skin barrier.",
        "Salicylic acid is itself a BHA. Combining with additional AHAs/BHAs increases exfoliation intensity and risk of irritation.",
    ),
    (
        "Retinol", "Niacinamide",
        "SEQUENCE", "LOW",
        "These may be used together. Niacinamide may help support barrier function when using retinol.",
        "Niacinamide is considered a helpful companion ingredient to retinoids — it supports the skin barrier and may reduce irritation.",
    ),
    (
        "Peptides", "AHAs / BHAs",
        "CAUTION", "MODERATE",
        "Apply peptides and AHAs/BHAs at separate routine steps. Low-pH environments from AHAs may reduce peptide effectiveness.",
        "Peptides are pH-sensitive. The low-pH environment created by AHAs/BHAs may affect their performance. Separate application times are recommended.",
    ),
    (
        "Hyaluronic Acid", "Retinol",
        "SEQUENCE", "LOW",
        "Apply hyaluronic acid after retinol to support hydration and reduce dryness associated with retinol use.",
        "Hyaluronic acid is a helpful companion to retinol — it supports hydration and may reduce the dryness and flaking that some individuals experience.",
    ),
]


class IngredientService:
    """
    Ingredient intelligence service.
    All methods are class methods — no instance state needed.
    """

    # ── Search & Lookup ───────────────────────────────────────────────────────

    @classmethod
    def list_ingredients(
        cls,
        db: Session,
        search: Optional[str] = None,
        category: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> List[IngredientBrief]:
        """Return paginated list of active ingredients, optionally filtered."""
        query = db.query(Ingredient).filter(Ingredient.is_active == True)
        if category:
            query = query.filter(func.upper(Ingredient.category) == category.upper())
        if search:
            term = f"%{search.lower()}%"
            query = query.filter(
                or_(
                    Ingredient.normalized_name.ilike(term),
                    Ingredient.name.ilike(term),
                )
            )
        ingredients = query.offset(skip).limit(limit).all()
        return [IngredientBrief.model_validate(i) for i in ingredients]

    @classmethod
    def get_ingredient(cls, db: Session, ingredient_id: uuid.UUID) -> Optional[IngredientDetailOut]:
        """Get full ingredient detail by UUID."""
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id, Ingredient.is_active == True).first()
        if not ingredient:
            return None
        return IngredientDetailOut.model_validate(ingredient)

    @classmethod
    def get_ingredient_by_name(cls, db: Session, name: str) -> Optional[IngredientDetailOut]:
        """Get full ingredient detail by normalized name."""
        normalized = name.strip().lower()
        ingredient = db.query(Ingredient).filter(
            Ingredient.normalized_name == normalized,
            Ingredient.is_active == True,
        ).first()
        if not ingredient:
            return None
        return IngredientDetailOut.model_validate(ingredient)

    # ── Suitability Engine ────────────────────────────────────────────────────

    @classmethod
    def evaluate_suitability(
        cls,
        db: Session,
        ingredient_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> SuitabilityResult:
        """
        Evaluate ingredient suitability against a user's skin profile.

        Returns: suitable | conditionally_suitable | unsuitable | unknown

        Safety rule: allergen conflict is always UNSUITABLE and overrides all other factors.
        """
        ingredient = db.query(Ingredient).filter(Ingredient.id == ingredient_id).first()
        if not ingredient:
            return SuitabilityResult(
                ingredient_id=ingredient_id,
                ingredient_name="Unknown",
                status="unknown",
                reasons=["Ingredient not found in the knowledge base."],
                warnings=[],
                supporting_factors=[],
            )

        skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        latest_assessment = (
            db.query(SkinAssessment)
            .filter(SkinAssessment.user_id == user_id, SkinAssessment.status == "COMPLETED")
            .order_by(SkinAssessment.created_at.desc())
            .first()
        )

        reasons: List[str] = []
        warnings: List[str] = []
        supporting_factors: List[str] = []

        # ── 1. Allergen check (HARD BLOCK) ───────────────────────────────────
        if skin_profile and skin_profile.allergies:
            declared_allergies = [a.strip().lower() for a in skin_profile.allergies.split(",") if a.strip()]
            ing_aliases = [ingredient.normalized_name] + [a.lower() for a in (ingredient.aliases or [])]
            conflict = any(
                any(allergy in alias or alias in allergy for alias in ing_aliases)
                for allergy in declared_allergies
            )
            if conflict:
                return SuitabilityResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    status="unsuitable",
                    reasons=["Excluded due to declared allergy conflict. (ALLERGEN_CONFLICT)"],
                    warnings=["This ingredient matches a declared allergy in your profile."],
                    supporting_factors=[],
                )

        # ── 2. Skin type compatibility ────────────────────────────────────────
        user_skin_type = skin_profile.skin_type.upper() if skin_profile else None

        if user_skin_type:
            if ingredient.avoid_for and user_skin_type in ingredient.avoid_for:
                reasons.append(f"Your skin type ({user_skin_type.title()}) is listed as a caution profile for this ingredient.")
                warnings.append("This ingredient may not be well-suited for your skin type.")
                return SuitabilityResult(
                    ingredient_id=ingredient.id,
                    ingredient_name=ingredient.name,
                    status="conditionally_suitable",
                    reasons=reasons,
                    warnings=warnings,
                    supporting_factors=[],
                )

            if ingredient.suitable_for and user_skin_type in ingredient.suitable_for:
                supporting_factors.append(f"Your skin type ({user_skin_type.title()}) is in the compatible profiles for this ingredient.")

            if ingredient.caution_for and user_skin_type in ingredient.caution_for:
                warnings.append(f"Use with caution: this ingredient may require patch testing for {user_skin_type.title()} skin.")

        # ── 3. Sensitivity check ──────────────────────────────────────────────
        if skin_profile and skin_profile.sensitivities:
            declared_sensitivities = [s.strip().lower() for s in skin_profile.sensitivities.split(",") if s.strip()]
            if ingredient.caution_notes:
                for sens in declared_sensitivities:
                    if sens and sens in ingredient.caution_notes.lower():
                        warnings.append(f"Your declared sensitivity to '{sens}' may require extra caution with this ingredient.")

        # ── 4. Concern relevance ──────────────────────────────────────────────
        if latest_assessment:
            assessment_concerns = db.query(AssessmentConcern).filter(
                AssessmentConcern.assessment_id == latest_assessment.id
            ).all()
            concern_codes = {c.concern_name.upper() for c in assessment_concerns}
            ingredient_targets = {t.upper() for t in (ingredient.target_concerns or [])}
            matching = concern_codes & ingredient_targets
            if matching:
                formatted = ", ".join(t.replace("_", " ").title() for t in matching)
                supporting_factors.append(f"Your profile indicates concerns relevant to this ingredient: {formatted}.")

        # ── Determine final status ────────────────────────────────────────────
        if warnings and not supporting_factors:
            status = "conditionally_suitable"
            reasons.append("Your profile suggests caution — review the warnings below.")
        elif supporting_factors and not warnings:
            status = "suitable"
            reasons.append("Your skin profile indicates this ingredient may be suitable for you.")
        elif supporting_factors and warnings:
            status = "conditionally_suitable"
            reasons.append("This ingredient may be relevant to your concerns but requires careful use given your profile.")
        else:
            status = "conditionally_suitable"
            reasons.append("Your profile does not have enough data to make a strong determination. Review with a professional.")

        if not skin_profile:
            reasons = ["Complete your skin profile to receive personalised suitability information."]
            status = "unknown"

        return SuitabilityResult(
            ingredient_id=ingredient.id,
            ingredient_name=ingredient.name,
            status=status,
            reasons=reasons,
            warnings=warnings,
            supporting_factors=supporting_factors,
        )

    # ── Interaction Engine ────────────────────────────────────────────────────

    @classmethod
    def check_interactions(
        cls,
        db: Session,
        ingredient_names: List[str],
    ) -> InteractionCheckResponse:
        """
        Check all known interactions between the given list of ingredient names.
        Uses normalized_name matching + alias matching.
        """
        normalized = [n.strip().lower() for n in ingredient_names if n.strip()]

        # Resolve to ingredient records
        ingredients = db.query(Ingredient).filter(
            or_(*[Ingredient.normalized_name.ilike(f"%{n}%") for n in normalized])
        ).all() if normalized else []

        ingredient_ids = [i.id for i in ingredients]
        found_interactions: List[InteractionResult] = []

        if len(ingredient_ids) < 2:
            return InteractionCheckResponse(
                checked=ingredient_names,
                interactions=[],
                has_conflicts=False,
            )

        # Query interactions where BOTH ingredients are in the list
        interactions = db.query(IngredientInteraction).filter(
            IngredientInteraction.ingredient_a_id.in_(ingredient_ids),
            IngredientInteraction.ingredient_b_id.in_(ingredient_ids),
        ).all()

        for intr in interactions:
            found_interactions.append(InteractionResult(
                ingredient_a=intr.ingredient_a.name if intr.ingredient_a else "Unknown",
                ingredient_b=intr.ingredient_b.name if intr.ingredient_b else "Unknown",
                interaction_type=intr.interaction_type,
                severity=intr.severity,
                recommendation=intr.recommendation,
                description=intr.description,
            ))

        has_conflicts = any(r.interaction_type in ("AVOID", "CAUTION") for r in found_interactions)
        return InteractionCheckResponse(
            checked=ingredient_names,
            interactions=found_interactions,
            has_conflicts=has_conflicts,
        )

    # ── Seed Interactions ─────────────────────────────────────────────────────

    @classmethod
    def seed_interactions_if_empty(cls, db: Session) -> None:
        """
        Seed canonical ingredient interactions on first startup if the table is empty.
        Idempotent — does nothing if interactions already exist.
        """
        existing = db.query(IngredientInteraction).count()
        if existing > 0:
            return

        for (name_a, name_b, itype, severity, recommendation, description) in _INTERACTION_SEED:
            ing_a = db.query(Ingredient).filter(Ingredient.name == name_a).first()
            ing_b = db.query(Ingredient).filter(Ingredient.name == name_b).first()
            if ing_a and ing_b:
                interaction = IngredientInteraction(
                    ingredient_a_id=ing_a.id,
                    ingredient_b_id=ing_b.id,
                    interaction_type=itype,
                    severity=severity,
                    recommendation=recommendation,
                    description=description,
                )
                db.add(interaction)
        try:
            db.commit()
        except Exception:
            db.rollback()
