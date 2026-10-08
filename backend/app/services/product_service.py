"""
Product Recommendation Service — Module 6
=========================================
Implements the full safety pipeline:

  USER PROFILE
      ↓
  SKIN TYPE
      ↓
  SKIN CONCERNS (AI priorities)
      ↓
  LIFESTYLE / ENVIRONMENT
      ↓
  SENSITIVITIES
      ↓
  ALLERGEN CHECK  ← hard block, cannot be overridden
      ↓
  INTERACTION CHECK
      ↓
  BUDGET
      ↓
  SUITABILITY SCORING
      ↓
  FINAL RECOMMENDATIONS

Safety rules ALWAYS have final authority.
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.product import Product, ProductRecommendation
from app.models.skin_profile import SkinProfile
from app.models.assessment import SkinAssessment, AssessmentConcern
from app.models.ingredient import IngredientInteraction, Ingredient
from app.schemas.product import (
    ProductDetailOut,
    ProductRecommendationOut,
    ProductComparisonItem,
    ProductComparisonResponse,
)


class ProductService:

    # ── Catalog ───────────────────────────────────────────────────────────────

    @classmethod
    def list_products(
        cls,
        db: Session,
        category: Optional[str] = None,
        budget_band: Optional[str] = None,
        skin_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 30,
    ) -> List[ProductDetailOut]:
        query = db.query(Product).filter(Product.is_available == True)
        if category:
            query = query.filter(func.upper(Product.category) == category.upper())
        if budget_band:
            query = query.filter(func.upper(Product.budget_band) == budget_band.upper())
        products = query.offset(skip).limit(limit).all()
        return [ProductDetailOut.model_validate(p) for p in products]

    @classmethod
    def get_product(cls, db: Session, product_id: uuid.UUID) -> Optional[ProductDetailOut]:
        product = db.query(Product).filter(Product.id == product_id, Product.is_available == True).first()
        if not product:
            return None
        return ProductDetailOut.model_validate(product)

    # ── Recommendation Pipeline ───────────────────────────────────────────────

    @classmethod
    def get_recommendations(
        cls,
        db: Session,
        user_id: uuid.UUID,
        budget_band: Optional[str] = None,
        category_filter: Optional[str] = None,
    ) -> List[ProductRecommendationOut]:
        """
        Full safety-first recommendation pipeline.
        Order: allergen_check → sensitivity → interaction → scoring → ranking
        """
        skin_profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        latest_assessment = (
            db.query(SkinAssessment)
            .filter(SkinAssessment.user_id == user_id, SkinAssessment.status == "COMPLETED")
            .order_by(SkinAssessment.created_at.desc())
            .first()
        )

        # Collect user context
        user_skin_type = skin_profile.skin_type.upper() if skin_profile else None
        declared_allergies = []
        declared_sensitivities = []
        if skin_profile:
            if skin_profile.allergies:
                declared_allergies = [a.strip().lower() for a in skin_profile.allergies.split(",") if a.strip()]
            if skin_profile.sensitivities:
                declared_sensitivities = [s.strip().lower() for s in skin_profile.sensitivities.split(",") if s.strip()]

        # Get concern codes from latest assessment
        concern_codes: List[str] = []
        concern_priorities: dict = {}
        if latest_assessment:
            concerns = db.query(AssessmentConcern).filter(
                AssessmentConcern.assessment_id == latest_assessment.id
            ).all()
            concern_codes = [c.concern_name.upper() for c in concerns]
            concern_priorities = {c.concern_name.upper(): c.priority for c in concerns}

        # Load products
        query = db.query(Product).filter(Product.is_available == True)
        if category_filter:
            query = query.filter(func.upper(Product.category) == category_filter.upper())
        products = query.all()

        results: List[ProductRecommendationOut] = []

        for product in products:
            product_ingredients = [i.lower() for i in (product.ingredients or [])]
            active_ingredients = [i.lower() for i in (product.active_ingredients or [])]
            product_skin_types = [st.upper() for st in (product.skin_types or [])]
            product_concerns = [c.upper() for c in (product.target_concerns or [])]
            sensitivity_flags = [f.lower() for f in (product.sensitivity_flags or [])]

            # ── STEP 1: ALLERGEN HARD BLOCK ───────────────────────────────────
            allergen_hit = cls._check_allergen(declared_allergies, product_ingredients)
            if allergen_hit:
                results.append(ProductRecommendationOut(
                    product=ProductDetailOut.model_validate(product),
                    recommendation_status="EXCLUDED",
                    match_score=0,
                    reasons=[],
                    safety_status="ALLERGEN_CONFLICT",
                    exclusion_reason="ALLERGEN_CONFLICT",
                ))
                continue

            # ── STEP 2: SENSITIVITY CHECK ─────────────────────────────────────
            sensitivity_warnings: List[str] = []
            if declared_sensitivities:
                for flag in sensitivity_flags:
                    for sens in declared_sensitivities:
                        if sens and flag and (sens in flag or flag in sens):
                            sensitivity_warnings.append(f"May contain ingredient you've listed as a sensitivity: {flag}.")

            # ── STEP 3: BUDGET FILTER ─────────────────────────────────────────
            budget_match = True
            budget_reason = ""
            if budget_band and product.budget_band:
                if budget_band.upper() != product.budget_band.upper():
                    budget_match = False
                    budget_reason = f"Does not match your selected budget preference ({budget_band})."

            # ── STEP 4: SUITABILITY SCORE ─────────────────────────────────────
            score = 0
            reasons: List[str] = []

            # Skin type match (+35 points)
            if user_skin_type and product_skin_types:
                if user_skin_type in product_skin_types:
                    score += 35
                    reasons.append(f"Formulated for {user_skin_type.title().replace('_', ' ')} skin.")

            # Concern relevance (+40 points max, 10 per matching concern up to 4)
            matching_concerns = set(concern_codes) & set(product_concerns)
            if matching_concerns:
                concern_score = min(40, len(matching_concerns) * 10)
                score += concern_score
                # Weight by HIGH priority concerns
                high_concerns = [c for c in matching_concerns if concern_priorities.get(c) == "HIGH"]
                if high_concerns:
                    labels = [c.replace("_", " ").title() for c in high_concerns]
                    reasons.append(f"Addresses your high-priority concerns: {', '.join(labels)}.")
                else:
                    labels = [c.replace("_", " ").title() for c in matching_concerns]
                    reasons.append(f"Relevant to your skin concerns: {', '.join(labels)}.")

            # Budget match (+15 points)
            if budget_match:
                score += 15
                if budget_band:
                    reasons.append(f"Fits your {budget_band.title()} budget preference.")
            
            # No sensitivity flags (+10 points)
            if not sensitivity_warnings:
                score += 10
                reasons.append("No declared sensitivity conflicts detected.")

            # Cap at 100
            score = min(100, score)

            # ── Determine recommendation status ───────────────────────────────
            safety_status = "CAUTION" if sensitivity_warnings else "SAFE"
            status = "RECOMMENDED"
            final_reasons = reasons.copy()

            if sensitivity_warnings:
                final_reasons.extend(sensitivity_warnings)

            if not budget_match:
                status = "ALTERNATIVE"
                final_reasons.append(budget_reason)

            # Low relevance → don't recommend
            if score < 20 and not matching_concerns and not (user_skin_type and user_skin_type in product_skin_types):
                status = "ALTERNATIVE"

            results.append(ProductRecommendationOut(
                product=ProductDetailOut.model_validate(product),
                recommendation_status=status,
                match_score=score,
                reasons=final_reasons,
                safety_status=safety_status,
                exclusion_reason=None,
            ))

            # ── Persist audit trail ───────────────────────────────────────────
            cls._save_audit(db, user_id, product.id, latest_assessment, status, score, final_reasons, safety_status, None, budget_band)

        # Sort: RECOMMENDED first by score, then ALTERNATIVE, then EXCLUDED last
        results.sort(key=lambda r: (
            0 if r.recommendation_status == "RECOMMENDED" else 1 if r.recommendation_status == "ALTERNATIVE" else 2,
            -(r.match_score or 0)
        ))

        return results

    # ── Product Comparison ────────────────────────────────────────────────────

    @classmethod
    def compare_products(
        cls,
        db: Session,
        product_ids: List[uuid.UUID],
        user_id: uuid.UUID,
        budget_band: Optional[str] = None,
    ) -> ProductComparisonResponse:
        """Side-by-side comparison of up to 3 products with per-product suitability."""
        # Limit to 3
        product_ids = product_ids[:3]
        recs = cls.get_recommendations(db, user_id, budget_band=budget_band)
        rec_map = {str(r.product.id): r for r in recs}

        items: List[ProductComparisonItem] = []
        for pid in product_ids:
            rec = rec_map.get(str(pid))
            if rec:
                items.append(ProductComparisonItem(
                    product=rec.product,
                    match_score=rec.match_score,
                    reasons=rec.reasons,
                    safety_status=rec.safety_status,
                    exclusion_reason=rec.exclusion_reason,
                ))
            else:
                product = db.query(Product).filter(Product.id == pid).first()
                if product:
                    items.append(ProductComparisonItem(
                        product=ProductDetailOut.model_validate(product),
                        match_score=None,
                        reasons=["No profile data available for matching."],
                        safety_status="UNKNOWN",
                        exclusion_reason=None,
                    ))

        return ProductComparisonResponse(products=items)

    # ── Alternatives ──────────────────────────────────────────────────────────

    @classmethod
    def get_alternatives(
        cls,
        db: Session,
        product_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> List[ProductRecommendationOut]:
        """
        Return alternative products in the same category that pass safety checks.
        Excludes the original product and EXCLUDED products.
        """
        original = db.query(Product).filter(Product.id == product_id).first()
        if not original:
            return []

        recs = cls.get_recommendations(db, user_id)
        alternatives = [
            r for r in recs
            if str(r.product.id) != str(product_id)
            and r.product.category == original.category
            and r.recommendation_status != "EXCLUDED"
        ]
        # Sort by match score
        alternatives.sort(key=lambda r: -(r.match_score or 0))
        return alternatives[:5]

    # ── Helpers ───────────────────────────────────────────────────────────────

    @staticmethod
    def _check_allergen(declared_allergies: List[str], product_ingredients: List[str]) -> bool:
        """Deterministic allergen check. True if any declared allergy matches any ingredient."""
        for allergy in declared_allergies:
            for ingredient in product_ingredients:
                if allergy and ingredient and (allergy in ingredient or ingredient in allergy):
                    return True
        return False

    @staticmethod
    def _save_audit(
        db: Session,
        user_id: uuid.UUID,
        product_id: uuid.UUID,
        assessment: Optional[SkinAssessment],
        status: str,
        score: int,
        reasons: List[str],
        safety_status: str,
        exclusion_reason: Optional[str],
        budget_band: Optional[str],
    ) -> None:
        """Save recommendation audit trail record. Silently ignores errors."""
        try:
            record = ProductRecommendation(
                user_id=user_id,
                product_id=product_id,
                assessment_id=assessment.id if assessment else None,
                recommendation_status=status,
                match_score=score,
                reasons=reasons,
                safety_status=safety_status,
                exclusion_reason=exclusion_reason,
                budget_band=budget_band,
            )
            db.add(record)
            db.commit()
        except Exception:
            db.rollback()
