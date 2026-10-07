import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from models import Ingredient, SkinProfile

SEED_INGREDIENTS = [
    {
        "name": "Retinol",
        "category": "Retinoids",
        "description": "Vitamin A derivative that accelerates cellular turnover, reduces fine lines, and treats hyperpigmentation.",
        "key_benefits": ["Anti-Aging", "Cellular Turnover", "Acne Reduction", "Collagen Stimulation"],
        "suitable_skin_types": ["Normal", "Oily", "Combination", "Dry"],
        "conflicting_ingredients": ["Glycolic Acid", "Salicylic Acid", "Lactic Acid", "Vitamin C"],
        "synergistic_ingredients": ["Niacinamide", "Ceramides", "Hyaluronic Acid"],
        "allergen_warning": "May cause dryness or purging during initial 2-4 weeks of use."
    },
    {
        "name": "Niacinamide",
        "category": "Niacinamide",
        "description": "Vitamin B3 compound that strengthens skin barrier, regulates sebum, and fades post-acne dark spots.",
        "key_benefits": ["Pore Minimizing", "Sebum Control", "Barrier Repair", "Redness Reduction"],
        "suitable_skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "conflicting_ingredients": ["L-Ascorbic Acid (Pure Vitamin C)"],
        "synergistic_ingredients": ["Zinc PCA", "Hyaluronic Acid", "Retinol", "Ceramides"],
        "allergen_warning": "Well tolerated by most skin types."
    },
    {
        "name": "L-Ascorbic Acid",
        "category": "Vitamin C",
        "description": "Potent antioxidant that neutralizes free radicals, boosts collagen synthesis, and brightens dull skin tone.",
        "key_benefits": ["Antioxidant Shield", "Dark Spot Fading", "Collagen Boost", "Radiance"],
        "suitable_skin_types": ["Normal", "Oily", "Combination", "Dry"],
        "conflicting_ingredients": ["Retinol", "Niacinamide", "Glycolic Acid", "Salicylic Acid"],
        "synergistic_ingredients": ["Vitamin E", "Ferulic Acid", "Hyaluronic Acid"],
        "allergen_warning": "High concentrations (15%+) may sting sensitive skin."
    },
    {
        "name": "Hyaluronic Acid",
        "category": "Hyaluronic Acid",
        "description": "Humectant capable of binding 1,000x its weight in water to plump fine lines and restore moisture.",
        "key_benefits": ["Deep Hydration", "Skin Plumping", "Barrier Support"],
        "suitable_skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "conflicting_ingredients": [],
        "synergistic_ingredients": ["Ceramides", "Panthenol", "Glycerin", "Peptides"],
        "allergen_warning": "Non-comedogenic and hypoallergenic."
    },
    {
        "name": "Salicylic Acid",
        "category": "Salicylic Acid",
        "description": "Oil-soluble Beta Hydroxy Acid (BHA) that penetrates deep into pores to dissolve sebum and prevent breakouts.",
        "key_benefits": ["Pore Decongestion", "Acne Treatment", "Blackhead Reduction", "Anti-Inflammatory"],
        "suitable_skin_types": ["Oily", "Combination"],
        "conflicting_ingredients": ["Retinol", "Glycolic Acid", "Vitamin C"],
        "synergistic_ingredients": ["Niacinamide", "Tea Tree Extract", "Hyaluronic Acid"],
        "allergen_warning": "May cause dryness if overused."
    },
    {
        "name": "Ceramides NP",
        "category": "Ceramides",
        "description": "Essential epidermal lipids that lock in hydration and repair compromised skin moisture barriers.",
        "key_benefits": ["Barrier Restoration", "TEWL Prevention", "Soothing"],
        "suitable_skin_types": ["Normal", "Dry", "Sensitive", "Combination"],
        "conflicting_ingredients": [],
        "synergistic_ingredients": ["Cholesterol", "Fatty Acids", "Hyaluronic Acid", "Peptides"],
        "allergen_warning": "Extremely gentle and skin-identical."
    },
    {
        "name": "Copper Peptides",
        "category": "Peptides",
        "description": "Signal amino acid chains that promote tissue repair, firmness, and elasticity.",
        "key_benefits": ["Firming", "Tissue Repair", "Elasticity", "Anti-Wrinkle"],
        "suitable_skin_types": ["Normal", "Dry", "Combination", "Sensitive"],
        "conflicting_ingredients": ["L-Ascorbic Acid", "AHAs/BHAs"],
        "synergistic_ingredients": ["Hyaluronic Acid", "Ceramides"],
        "allergen_warning": "Rare sensitivity."
    },
    {
        "name": "Glycolic Acid",
        "category": "AHAs/BHAs",
        "description": "Water-soluble Alpha Hydroxy Acid (AHA) with small molecular size for resurfacing dead skin cells.",
        "key_benefits": ["Exfoliation", "Skin Resurfacing", "Texture Improvement", "Brightening"],
        "suitable_skin_types": ["Normal", "Oily", "Combination"],
        "conflicting_ingredients": ["Retinol", "Salicylic Acid", "Vitamin C"],
        "synergistic_ingredients": ["Hyaluronic Acid", "Glycerin"],
        "allergen_warning": "May cause tingling; use sun protection daily."
    }
]


def seed_ingredients_db(db: Session):
    """Populates ingredients database if empty."""
    if db.query(Ingredient).count() == 0:
        for item in SEED_INGREDIENTS:
            ing = Ingredient(
                name=item["name"],
                category=item["category"],
                description=item["description"],
                key_benefits=json.dumps(item["key_benefits"]),
                suitable_skin_types=json.dumps(item["suitable_skin_types"]),
                conflicting_ingredients=json.dumps(item["conflicting_ingredients"]),
                synergistic_ingredients=json.dumps(item["synergistic_ingredients"]),
                allergen_warning=item["allergen_warning"],
            )
            db.add(ing)
        db.commit()


def analyze_formula(db: Session, ingredients_text: str, user_profile: SkinProfile = None) -> Dict[str, Any]:
    """
    Parses an ingredient list, checks for conflict interactions, user allergies/sensitivities,
    and returns formula suitability breakdown.
    """
    seed_ingredients_db(db)
    raw_list = [i.strip() for i in ingredients_text.replace("\n", ",").split(",") if i.strip()]

    all_db_ingredients = db.query(Ingredient).all()
    matched_ingredients = []
    detected_conflicts = []
    allergy_warnings = []

    user_allergies = (user_profile.allergies or "").lower() if user_profile else ""
    user_sensitivities = (user_profile.sensitivities or "").lower() if user_profile else ""

    found_names = []
    for item_str in raw_list:
        matched = False
        for db_ing in all_db_ingredients:
            if db_ing.name.lower() in item_str.lower() or item_str.lower() in db_ing.name.lower():
                found_names.append(db_ing.name)
                matched_ingredients.append({
                    "name": db_ing.name,
                    "category": db_ing.category,
                    "description": db_ing.description,
                    "key_benefits": json.loads(db_ing.key_benefits or "[]"),
                    "allergen_warning": db_ing.allergen_warning
                })
                matched = True
                break
        if not matched:
            matched_ingredients.append({
                "name": item_str,
                "category": "General Cosmetic Compound",
                "description": "Standard cosmetic excipient or botanical extract.",
                "key_benefits": ["Emollient", "Texture Enhancer"],
                "allergen_warning": ""
            })

    # Check Conflicts among found active ingredients
    for db_ing in all_db_ingredients:
        if db_ing.name in found_names:
            conflicts = json.loads(db_ing.conflicting_ingredients or "[]")
            for other_name in found_names:
                if other_name != db_ing.name and other_name in conflicts:
                    pair_key = tuple(sorted([db_ing.name, other_name]))
                    conflict_obj = {
                        "ingredient_a": pair_key[0],
                        "ingredient_b": pair_key[1],
                        "issue": f"{pair_key[0]} and {pair_key[1]} can destabilize each other or cause severe skin irritation when used simultaneously.",
                        "recommendation": f"Separate application: Use {pair_key[0]} in the Morning and {pair_key[1]} in the Evening."
                    }
                    if conflict_obj not in detected_conflicts:
                        detected_conflicts.append(conflict_obj)

    # Check Allergies / Sensitivities
    for item_str in raw_list:
        if user_allergies and user_allergies != "none":
            for alg in user_allergies.split(","):
                alg = alg.strip()
                if alg and alg in item_str.lower():
                    allergy_warnings.append({
                        "ingredient": item_str,
                        "risk_level": "High Allergy Alert",
                        "details": f"Matches your reported allergy to '{alg}'."
                    })
        if user_sensitivities and user_sensitivities != "none":
            for sens in user_sensitivities.split(","):
                sens = sens.strip()
                if sens and sens in item_str.lower():
                    allergy_warnings.append({
                        "ingredient": item_str,
                        "risk_level": "Sensitivity Warning",
                        "details": f"Matches your reported sensitivity to '{sens}'."
                    })

    # Formula Suitability Score Calculation
    base_score = 95.0
    base_score -= len(detected_conflicts) * 15.0
    base_score -= len(allergy_warnings) * 20.0
    suitability_score = max(20.0, min(100.0, base_score))

    summary = (
        f"Analyzed {len(raw_list)} ingredients. "
        f"Found {len(detected_conflicts)} interaction conflicts and {len(allergy_warnings)} allergy/sensitivity warnings. "
        f"Overall Formula Suitability: {round(suitability_score, 1)}%."
    )

    return {
        "analyzed_ingredients": matched_ingredients,
        "detected_conflicts": detected_conflicts,
        "allergy_warnings": allergy_warnings,
        "overall_suitability_score": round(suitability_score, 1),
        "summary": summary
    }
