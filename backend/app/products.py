"""
AI Product Recommendation Engine
Milestone 3 – Content-Based ML (Cosine Similarity)
Loads products from the database (with JSON fallback).
"""

from __future__ import annotations
from typing import Any, Dict

from app.ml.recommendation_engine import ProductRecommender

# Lazy singleton – created only when needed (inside app context)
_recommender = None


def get_recommender() -> ProductRecommender:
    global _recommender
    if _recommender is None:
        _recommender = ProductRecommender()
    return _recommender


def get_product_suggestions(
    skin_type: str = None,
    concerns: list = None,
    budget: str = None,
    sensitivities: str = None,
    allergies: str = None,
) -> Dict[str, Any]:
    skin_type = (skin_type or "normal").lower().strip()
    concerns = [c.lower().strip() for c in (concerns or [])]

    rec = get_recommender()

    ml_result = rec.get_product_suggestions(
        user_profile={
            "skin_type": skin_type,
            "concerns": concerns,
            "price_tier": budget,
            "fragrance_free": "fragrance" in (sensitivities or "").lower()
                              or "fragrance" in (allergies or "").lower(),
            "alcohol_free": "alcohol" in (sensitivities or "").lower()
                            or "alcohol" in (allergies or "").lower(),
        },
        top_k=40,  # get more candidates
    )

    ranked = ml_result["recommendations"]

    category_map = {
        "Cleanser": "Face Wash",
        "Toner": "Toner",
        "Serum": "Serum",
        "Moisturizer": "Moisturizer",
        "Sunscreen": "Sunscreen",
        "Treatment": "Treatment Products",
        "Mask": "Face Masks",
        "Eye Care": "Treatment Products",
    }

    by_category = {
        "Face Wash": [],
        "Toner": [],
        "Serum": [],
        "Moisturizer": [],
        "Sunscreen": [],
        "Treatment Products": [],
        "Face Masks": [],
    }

    # First pass – fill with best matches
    for item in ranked:
        ml_cat = item.get("category", "")
        old_cat = category_map.get(ml_cat, "Treatment Products")

        if old_cat in by_category and len(by_category[old_cat]) < 3:
            adapted = {
                "name": item["name"],
                "category": old_cat,
                "budget": item.get("price_tier", "mid"),
                "best_for": item.get("skin_types", []) + item.get("concerns", []),
                "score": int(item.get("match_percentage", 70)),
                "key_ingredients": item.get("key_ingredients", []),
                "avoid_if": [],
                "suitability_score": max(55, int(item.get("match_percentage", 70))),  # floor for display
                "match_reasons": item.get("match_reasons") or ["Recommended for your skin profile"],
                "brand": item.get("brand"),
                "price": item.get("price"),
                "texture": item.get("texture"),
                "rating": item.get("rating"),
            }
            by_category[old_cat].append(adapted)

    # Second pass – force-fill empty categories with next best products
    for item in ranked:
        ml_cat = item.get("category", "")
        old_cat = category_map.get(ml_cat, "Treatment Products")
        if old_cat in by_category and len(by_category[old_cat]) == 0:
            adapted = {
                "name": item["name"],
                "category": old_cat,
                "budget": item.get("price_tier", "mid"),
                "best_for": item.get("skin_types", []) + item.get("concerns", []),
                "score": int(item.get("match_percentage", 60)),
                "key_ingredients": item.get("key_ingredients", []),
                "avoid_if": [],
                "suitability_score": max(50, int(item.get("match_percentage", 60))),
                "match_reasons": item.get("match_reasons") or ["Best available match"],
                "brand": item.get("brand"),
                "price": item.get("price"),
                "texture": item.get("texture"),
                "rating": item.get("rating"),
            }
            by_category[old_cat].append(adapted)

    top_recommendations = []
    for item in ranked[:6]:
        top_recommendations.append({
            "name": item["name"],
            "category": category_map.get(item.get("category", ""), "Treatment Products"),
            "budget": item.get("price_tier", "mid"),
            "best_for": item.get("skin_types", []) + item.get("concerns", []),
            "score": max(55, int(item.get("match_percentage", 70))),
            "key_ingredients": item.get("key_ingredients", []),
            "avoid_if": [],
            "suitability_score": max(55, int(item.get("match_percentage", 70))),
            "match_reasons": item.get("match_reasons") or ["Recommended for your skin profile"],
            "brand": item.get("brand"),
            "price": item.get("price"),
        })

    comparison = top_recommendations[:3]
    alternatives = top_recommendations[3:8] if len(top_recommendations) > 3 else []

    simple = {
        "cleanser": [i["name"] for i in by_category["Face Wash"]],
        "serum": [i["name"] for i in by_category["Serum"]],
        "moisturizer": [i["name"] for i in by_category["Moisturizer"]],
        "sunscreen": [i["name"] for i in by_category["Sunscreen"]],
    }

    return {
        **simple,
        "by_category": by_category,
        "comparison": comparison,
        "alternatives": alternatives,
        "top_recommendations": top_recommendations,
        "budget_options": ["budget", "mid", "premium"],
        "total_considered": ml_result.get("count", len(ranked)),
        "model": "content_based_cosine_v1",
    }