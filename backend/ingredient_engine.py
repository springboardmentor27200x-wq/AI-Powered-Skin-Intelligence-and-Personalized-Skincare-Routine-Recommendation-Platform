"""SkinSense ingredient recommendation engine.

Recommendations are personalized primarily from the selected skin type and
concerns. The existing ML model is used only as a small secondary signal because
its training features do not include user concerns.
"""
from pathlib import Path

import joblib
import pandas as pd

from safety_engine import apply_safety_filter


# Keep this database aligned with the labels used by the assessment UI.
INGREDIENT_DATABASE = {
    "Niacinamide": {
        "purpose": "Supports the skin barrier and the appearance of uneven skin tone.",
        "concerns": ["Acne", "Dark Spots", "Hyperpigmentation", "Redness", "Uneven Skin Tone"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Barrier & Tone Support",
    },
    "Vitamin C": {
        "purpose": "Antioxidant commonly used to improve the appearance of dark spots and uneven tone.",
        "concerns": ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination"],
        "category": "Antioxidant",
    },
    "Salicylic Acid": {
        "purpose": "BHA used to help unclog pores and manage acne-prone skin.",
        "concerns": ["Acne"],
        "skin_types": ["Oily", "Combination"],
        "category": "BHA Exfoliant",
    },
    "Hyaluronic Acid": {
        "purpose": "Humectant that helps skin retain moisture.",
        "concerns": ["Fine Lines"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Hydration",
    },
    "Ceramides": {
        "purpose": "Help support the skin barrier and reduce moisture loss.",
        "concerns": ["Redness"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Barrier Support",
    },
    "Retinoid": {
        "purpose": "Vitamin A derivatives used for acne and the appearance of fine lines; can irritate skin.",
        "concerns": ["Acne", "Fine Lines", "Dark Spots"],
        "skin_types": ["Normal", "Oily", "Combination"],
        "category": "Retinoid",
    },
    "AHA": {
        "purpose": "Exfoliating acids that can improve the appearance of surface texture and uneven tone.",
        "concerns": ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone", "Fine Lines"],
        "skin_types": ["Normal", "Dry", "Combination"],
        "category": "AHA Exfoliant",
    },
    "Azelaic Acid": {
        "purpose": "Can help with the appearance of blemishes, redness, and post-blemish marks.",
        "concerns": ["Acne", "Redness", "Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Tone & Blemish Support",
    },
    "Peptides": {
        "purpose": "Skin-conditioning ingredients commonly used in products targeting the appearance of fine lines.",
        "concerns": ["Fine Lines"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Skin Conditioning",
    },
    "Panthenol": {
        "purpose": "Humectant and conditioning ingredient that supports moisture and skin comfort.",
        "concerns": ["Redness"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Soothing & Hydration",
    },
    "Centella Asiatica": {
        "purpose": "Soothing botanical used in products for skin comfort and visible redness.",
        "concerns": ["Redness"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Soothing",
    },
    "Squalane": {
        "purpose": "Emollient that helps soften skin and reduce moisture loss.",
        "concerns": [],
        "skin_types": ["Normal", "Dry", "Combination", "Sensitive"],
        "category": "Moisture Support",
    },
    "Zinc PCA": {
        "purpose": "Used in some formulations for oily-looking skin and blemish-prone routines.",
        "concerns": ["Acne"],
        "skin_types": ["Oily", "Combination"],
        "category": "Oil & Blemish Support",
    },
    "Tranexamic Acid": {
        "purpose": "Used in skincare products targeting the appearance of stubborn dark spots and uneven tone.",
        "concerns": ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination"],
        "category": "Tone Support",
    },
    "Allantoin": {
        "purpose": "Skin-conditioning ingredient used to help soothe and soften skin.",
        "concerns": ["Redness"],
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "category": "Soothing",
    },
}

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "SkinSense_ML_DataPipeline"
    / "models"
    / "ingredient_recommendation_model.joblib"
)

try:
    INGREDIENT_ML_MODEL = joblib.load(MODEL_PATH)
    ML_MODEL_AVAILABLE = True
    print("Ingredient ML model loaded successfully.")
except Exception as error:
    INGREDIENT_ML_MODEL = None
    ML_MODEL_AVAILABLE = False
    print(f"Ingredient ML model unavailable; profile-based scoring will be used: {error}")


def normalize_text(value):
    return str(value).strip().lower() if value is not None else ""


def normalize_concern(value):
    text = normalize_text(value).replace("_", " ").replace("-", " ")
    text = " ".join(text.split())
    aliases = {
        "acne prone skin": "acne",
        "pimples": "acne",
        "dark spot": "dark spots",
        "dark spots": "dark spots",
        "hyper pigmentation": "hyperpigmentation",
        "uneven tone": "uneven skin tone",
        "uneven skin tone": "uneven skin tone",
        "fine line": "fine lines",
        "fine lines": "fine lines",
        "redness": "redness",
        "dryness": "dry skin",
        "dry skin": "dry skin",
        "sensitivity": "sensitive skin",
        "sensitive skin": "sensitive skin",
    }
    return aliases.get(text, text)


def normalize_concerns(concerns):
    """Accept a list/tuple/set or a comma-separated database string."""
    if not concerns:
        return set()
    if isinstance(concerns, str):
        values = [item.strip() for item in concerns.split(",") if item.strip()]
    elif isinstance(concerns, (list, tuple, set)):
        values = list(concerns)
    else:
        values = [concerns]
    return {normalize_concern(value) for value in values if normalize_concern(value)}


def get_ingredient_information(ingredient_name):
    wanted = normalize_text(ingredient_name)
    for name, data in INGREDIENT_DATABASE.items():
        if normalize_text(name) == wanted:
            return {"ingredient": name, **data}
    return None


def create_ml_features(ingredient_name, skin_type):
    """Build the exact raw feature columns used by the saved model."""
    skin = normalize_text(skin_type)
    return {
        "ingredient": normalize_text(ingredient_name),
        "skin_type_dry": int(skin == "dry"),
        "skin_type_oily": int(skin == "oily"),
        "skin_type_combination": int(skin == "combination"),
        "skin_type_normal": int(skin == "normal"),
        "skin_type_sensitive": int(skin == "sensitive"),
        "skin_type_unknown": int(skin not in {"dry", "oily", "combination", "normal", "sensitive"}),
        "price": 0.0,
        "price_missing": 1,
        "review_count": 0,
    }


def predict_ingredient_ml_score(ingredient_name, skin_type):
    """Return a model probability only if the model accepts the expected features."""
    if not ML_MODEL_AVAILABLE:
        return None
    try:
        row = create_ml_features(ingredient_name, skin_type)
        expected = getattr(INGREDIENT_ML_MODEL, "feature_names_in_", None)
        if expected is not None:
            # Do not silently send a differently shaped dataframe to the model.
            row = {column: row.get(column, 0) for column in expected}
        input_df = pd.DataFrame([row])
        probabilities = INGREDIENT_ML_MODEL.predict_proba(input_df)[0]
        classes = list(getattr(INGREDIENT_ML_MODEL, "classes_", [0, 1]))
        positive_index = classes.index(1) if 1 in classes else len(probabilities) - 1
        return round(float(probabilities[positive_index]) * 100, 2)
    except Exception as error:
        print(f"Ingredient ML prediction failed; using profile score: {error}")
        return None


def analyze_ingredient_suitability(ingredient_name, skin_type, concerns):
    ingredient = get_ingredient_information(ingredient_name)
    if not ingredient:
        return {
            "ingredient": ingredient_name, "suitable": False, "score": 0,
            "ml_score": None, "reason": "Ingredient is not in the ingredient database."
        }

    skin = normalize_text(skin_type)
    user_concerns = normalize_concerns(concerns)
    ingredient_concerns = {normalize_concern(c) for c in ingredient["concerns"]}
    matching_concerns = sorted(user_concerns.intersection(ingredient_concerns))
    supported_skin_types = {normalize_text(s) for s in ingredient["skin_types"]}
    skin_match = skin in supported_skin_types

    # Concern relevance has priority. The trained model does not use concerns,
    # so it must never decide which concern an ingredient is for.
    concern_score = min(60, 30 * len(matching_concerns))
    skin_score = 25 if skin_match else 0
    general_support_score = 10 if not user_concerns and skin_match else 0
    profile_score = min(100, concern_score + skin_score + general_support_score)

    ml_score = predict_ingredient_ml_score(ingredient["ingredient"], skin_type)
    # Keep the non-concern-aware ML model secondary so it cannot dominate results.
    final_score = round(profile_score * 0.90 + (ml_score * 0.10 if ml_score is not None else 0), 2)

    # When concerns are selected, return ingredients matching a selected concern.
    # Also allow barrier/soothing support for sensitive/dry profiles, but not unrelated
    # oily/acne ingredients merely because the ML probability is high.
    skin_support_names = {
        "dry": {"Hyaluronic Acid", "Ceramides", "Squalane", "Panthenol", "Allantoin"},
        "sensitive": {"Ceramides", "Panthenol", "Centella Asiatica", "Allantoin", "Hyaluronic Acid"},
        "normal": {"Hyaluronic Acid", "Niacinamide", "Peptides"},
        "combination": {"Niacinamide", "Hyaluronic Acid", "Ceramides"},
        "oily": {"Niacinamide", "Hyaluronic Acid", "Zinc PCA"},
    }
    is_skin_support = ingredient["ingredient"] in skin_support_names.get(skin, set())
    suitable = skin_match and (bool(matching_concerns) or not user_concerns or is_skin_support)

    reason_parts = []
    if matching_concerns:
        reason_parts.append("Matches selected concern(s): " + ", ".join(matching_concerns) + ".")
    if skin_match:
        reason_parts.append(f"Listed for {skin_type} skin.")
    if is_skin_support and user_concerns and not matching_concerns:
        reason_parts.append("Included as supporting skin-barrier/hydration care for this skin type.")
    if ml_score is not None:
        reason_parts.append("ML score is used as a small secondary ranking signal, not as a medical or safety score.")

    return {
        "ingredient": ingredient["ingredient"],
        "category": ingredient["category"],
        "purpose": ingredient["purpose"],
        "concerns": ingredient["concerns"],
        "skin_types": ingredient["skin_types"],
        "matching_concerns": matching_concerns,
        "suitable": suitable,
        "score": final_score if suitable else 0,
        "ml_score": ml_score,
        "reason": " ".join(reason_parts) if suitable else "Not sufficiently matched to this skin profile.",
    }


def analyze_ingredients(skin_type, concerns):
    normalized_user_concerns = normalize_concerns(concerns)
    results = []
    for name in INGREDIENT_DATABASE:
        result = analyze_ingredient_suitability(name, skin_type, normalized_user_concerns)
        if result["suitable"]:
            results.append(result)

    # Put direct concern matches ahead of general skin-type support, then score.
    results.sort(
        key=lambda item: (
            bool(item.get("matching_concerns")),
            len(item.get("matching_concerns", [])),
            item["score"],
        ),
        reverse=True,
    )
    return results[:5]


def generate_safe_ingredient_recommendations(skin_type, concerns, allergies="", sensitivity=""):
    recommendations = analyze_ingredients(skin_type=skin_type, concerns=concerns)
    # The safety filter remains the final authority; the ML score cannot override it.
    return apply_safety_filter(
        recommendations=recommendations,
        allergies=allergies,
        sensitivity=sensitivity,
    )
