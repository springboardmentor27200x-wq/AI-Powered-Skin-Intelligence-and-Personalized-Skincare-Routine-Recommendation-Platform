"""Admin-side view of the recommendation engine: what is it actually recommending?

Runs the same scoring users see (ingredient suitability + product scoring) for every
user with a skin profile against every product, then summarises the results. Nothing
here re-implements scoring — it only calls the existing engines and aggregates.
"""
from collections import defaultdict

from app.services.ingredient_engine import assess_ingredient_suitability
from app.services.product_engine import score_product

RECOMMENDED_MIN_SCORE = 80  # at or above this, a product counts as "recommended" for that user
TOP_N = 5


def _mean(values):
    return sum(values) / len(values) if values else None


def monitor_recommendations(*, profiles, products, ingredients_by_product, concerns_by_user) -> dict:
    """
    profiles: objects with user_id, skin_type, allergies, sensitivities
    products: objects with id, name, category, brand, skin_types
    ingredients_by_product: {product_id: [objects with name, category]}
    concerns_by_user: {user_id: [prioritized concern names]}
    """
    profiles = list(profiles)
    products = list(products)

    per_product = {p.id: {"scores": [], "recommended": 0, "allergen": 0, "caution": 0} for p in products}
    per_category = defaultdict(list)
    all_scores: list[int] = []
    allergen_pairs = 0

    for profile in profiles:
        allergies = profile.allergies or []
        sensitivities = profile.sensitivities or []
        concerns = concerns_by_user.get(profile.user_id, [])

        for product in products:
            ingredients = ingredients_by_product.get(product.id, [])
            statuses = {}
            for ing in ingredients:
                status, _ = assess_ingredient_suitability(ing, allergies, sensitivities, profile.skin_type)
                statuses[ing.name] = status

            score, _ = score_product(
                product.skin_types or [],
                [(i.name, i.category) for i in ingredients],
                statuses,
                profile.skin_type,
                concerns,
            )

            stats = per_product[product.id]
            stats["scores"].append(score)
            if score >= RECOMMENDED_MIN_SCORE:
                stats["recommended"] += 1
            if "avoid" in statuses.values():
                stats["allergen"] += 1
                allergen_pairs += 1
            elif "caution" in statuses.values():
                stats["caution"] += 1

            per_category[product.category].append(score)
            all_scores.append(score)

    def entry(product):
        stats = per_product[product.id]
        return {
            "product_id": product.id,
            "name": product.name,
            "category": product.category,
            "brand": product.brand,
            "times_recommended": stats["recommended"],
            "average_score": round(_mean(stats["scores"]), 1) if stats["scores"] else 0.0,
            "allergen_conflicts": stats["allergen"],
            "caution_flags": stats["caution"],
        }

    entries = [entry(p) for p in products]

    top_products = sorted(
        (e for e in entries if e["times_recommended"] > 0),
        key=lambda e: (-e["times_recommended"], -e["average_score"], e["name"]),
    )[:TOP_N]

    most_flagged = sorted(
        (e for e in entries if e["allergen_conflicts"] + e["caution_flags"] > 0),
        key=lambda e: (-e["allergen_conflicts"], -e["caution_flags"], e["name"]),
    )[:TOP_N]

    products_per_category = defaultdict(int)
    for p in products:
        products_per_category[p.category] += 1
    category_scores = sorted(
        (
            {"category": c, "average_score": round(_mean(v), 1), "products": products_per_category[c]}
            for c, v in per_category.items()
        ),
        key=lambda c: (-c["average_score"], c["category"]),
    )

    total_pairs = len(profiles) * len(products)
    return {
        "users_evaluated": len(profiles),
        "products_evaluated": len(products),
        "recommended_min_score": RECOMMENDED_MIN_SCORE,
        "total_pairs": total_pairs,
        "average_score": round(_mean(all_scores), 1) if all_scores else None,
        "allergen_conflict_pairs": allergen_pairs,
        "conflict_rate": round(allergen_pairs / total_pairs * 100, 1) if total_pairs else None,
        "top_products": top_products,
        "most_flagged_products": most_flagged,
        "category_scores": category_scores,
    }