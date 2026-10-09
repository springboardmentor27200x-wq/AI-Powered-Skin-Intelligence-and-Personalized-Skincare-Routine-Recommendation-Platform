
import json
import os
import re

from dotenv import load_dotenv
from google import genai

# Load variables from backend/.env
load_dotenv()


# =========================================================
# 1. LOCAL INGREDIENT KNOWLEDGE BASE
# =========================================================

INGREDIENTS = {
    "Salicylic Acid": {
        "category": "BHA Exfoliant",
        "benefits": "Helps unclog pores and improve the appearance of acne-prone skin.",
        "education": "Salicylic acid is a beta hydroxy acid (BHA) used to exfoliate inside pores and remove excess dead skin cells.",
        "caution": "May cause dryness, peeling, or irritation. Introduce gradually and use sunscreen.",
        "concerns": ["acne", "blackheads", "clogged pores", "oily skin"],
    },
    "Niacinamide": {
        "category": "Vitamin B3",
        "benefits": "Supports the skin barrier and may improve uneven skin tone and excess oil.",
        "education": "Niacinamide is a form of vitamin B3 used to support skin barrier function and improve skin texture.",
        "caution": "Some people experience irritation. Stop using it if persistent redness or discomfort develops.",
        "concerns": ["oily skin", "uneven skin tone", "acne", "skin barrier", "dark spots"],
    },
    "Vitamin C": {
        "category": "Antioxidant",
        "benefits": "Helps protect skin from oxidative stress and may improve uneven skin tone.",
        "education": "Vitamin C is an antioxidant used in skincare. Its stability and effectiveness depend on the formulation.",
        "caution": "Some formulations may sting or irritate sensitive skin.",
        "concerns": ["dark spots", "dullness", "uneven skin tone"],
    },
    "Hyaluronic Acid": {
        "category": "Humectant",
        "benefits": "Helps attract and retain moisture.",
        "education": "Hyaluronic acid is a humectant commonly used in moisturizers and serums.",
        "caution": "Usually well tolerated, but the complete product formulation can still cause irritation.",
        "concerns": ["dry skin", "dehydration", "skin barrier"],
    },
    "Ceramides": {
        "category": "Skin Barrier Lipids",
        "benefits": "Help support the skin barrier and reduce moisture loss.",
        "education": "Ceramides are lipids naturally found in the skin barrier.",
        "caution": "Check the full product ingredient list if you have known allergies.",
        "concerns": ["dry skin", "sensitive skin", "skin barrier"],
    },
    "Panthenol": {
        "category": "Provitamin B5",
        "benefits": "Helps moisturize skin and support the skin barrier.",
        "education": "Panthenol is a moisturizing ingredient used in skincare products.",
        "caution": "Discontinue use if irritation develops.",
        "concerns": ["dry skin", "sensitive skin", "skin barrier"],
    },
    "Centella": {
        "category": "Botanical Skin-Conditioning Ingredient",
        "benefits": "May help soothe the feeling of irritated skin.",
        "education": "Centella asiatica extracts are used for soothing and skin conditioning.",
        "caution": "Botanical extracts can cause sensitivity in some people.",
        "concerns": ["sensitive skin", "redness", "skin barrier"],
    },
    "Peptides": {
        "category": "Skin-Conditioning Ingredients",
        "benefits": "Some peptide formulations may improve the appearance of skin texture and fine lines.",
        "education": "Peptides are short chains of amino acids. Their effects depend on the specific peptide and formulation.",
        "caution": "Evidence varies by peptide and product.",
        "concerns": ["fine lines", "skin texture"],
    },
    "Retinoids": {
        "category": "Vitamin A Derivatives",
        "benefits": "Certain retinoids may help improve acne and the appearance of fine lines.",
        "education": "Retinoids are vitamin A derivatives. Their strength, uses, and risks vary.",
        "caution": "May cause dryness, peeling, and irritation. Consult a healthcare professional before use if pregnant or trying to conceive.",
        "concerns": ["acne", "fine lines", "uneven skin texture"],
    },
    "AHA": {
        "category": "Alpha Hydroxy Acids",
        "benefits": "Help exfoliate the skin surface and may improve uneven texture.",
        "education": "Alpha hydroxy acids, such as glycolic acid and lactic acid, exfoliate the skin surface.",
        "caution": "May cause irritation and increase sensitivity to sunlight. Introduce cautiously and use sunscreen.",
        "concerns": ["uneven skin texture", "dullness", "dark spots"],
    },
}


# =========================================================
# 2. INGREDIENT ALIASES
# =========================================================

INGREDIENT_ALIASES = {
    "salicylic acid": "Salicylic Acid",
    "bha": "Salicylic Acid",
    "niacinamide": "Niacinamide",
    "vitamin b3": "Niacinamide",
    "vitamin c": "Vitamin C",
    "ascorbic acid": "Vitamin C",
    "hyaluronic acid": "Hyaluronic Acid",
    "ceramide": "Ceramides",
    "ceramides": "Ceramides",
    "panthenol": "Panthenol",
    "provitamin b5": "Panthenol",
    "centella": "Centella",
    "centella asiatica": "Centella",
    "peptide": "Peptides",
    "peptides": "Peptides",
    "retinol": "Retinoids",
    "retinoid": "Retinoids",
    "retinoids": "Retinoids",
    "tretinoin": "Retinoids",
    "aha": "AHA",
    "glycolic acid": "AHA",
    "lactic acid": "AHA",
    "alpha hydroxy acid": "AHA",
    "alpha hydroxy acids": "AHA",
}


# =========================================================
# 3. KNOWN INTERACTIONS
# =========================================================

INGREDIENT_INTERACTIONS = {
    frozenset(("retinoids", "aha")):
        "Combining retinoids and AHAs may increase irritation. "
        "Consider alternating them.",

    frozenset(("retinoids", "salicylic acid")):
        "Combining retinoids with salicylic acid may increase dryness "
        "and irritation. Consider using them on alternate days.",

    frozenset(("aha", "salicylic acid")):
        "Combining AHAs and salicylic acid may cause excessive "
        "exfoliation and irritation. Consider alternating products.",

    frozenset(("vitamin c", "retinoids")):
        "This combination may irritate some skin types depending on "
        "the formulations. Consider separating their use if irritation occurs.",
}


# =========================================================
# 4. NORMALIZATION
# =========================================================

def normalize_text(value):
    if value is None:
        return ""

    return re.sub(
        r"\s+",
        " ",
        str(value).strip().lower().replace("_", " "),
    )


def normalize_ingredient_name(name):
    normalized = normalize_text(name)

    if not normalized:
        return ""

    if normalized in INGREDIENT_ALIASES:
        return INGREDIENT_ALIASES[normalized]

    for ingredient_name in INGREDIENTS:
        if normalize_text(ingredient_name) == normalized:
            return ingredient_name

    # Preserve unknown ingredients for the Gemini fallback.
    return str(name).strip()


def concern_matches(ingredient, primary_concern):
    concern = normalize_text(primary_concern)

    if not concern:
        return True

    return any(
        normalize_text(item) in concern
        or concern in normalize_text(item)
        for item in ingredient.get("concerns", [])
    )


# =========================================================
# 5. ALLERGY SCREENING
# =========================================================

def ingredient_matches_allergy(ingredient, allergies):
    allergy_text = normalize_text(allergies)

    if not allergy_text:
        return False

    ingredient_name = normalize_text(ingredient)

    allergy_aliases = {
        "salicylic acid": ["salicylic acid", "bha"],
        "niacinamide": ["niacinamide", "vitamin b3"],
        "vitamin c": ["vitamin c", "ascorbic acid"],
        "hyaluronic acid": ["hyaluronic acid"],
        "ceramides": ["ceramide", "ceramides"],
        "panthenol": ["panthenol"],
        "centella": ["centella", "centella asiatica"],
        "peptides": ["peptide", "peptides"],
        "retinoids": ["retinoid", "retinoids", "retinol", "tretinoin"],
        "aha": ["aha", "glycolic acid", "lactic acid"],
    }

    terms = allergy_aliases.get(ingredient_name, [ingredient_name])

    allergy_items = [
        normalize_text(item)
        for item in re.split(r"[,;|]", allergy_text)
        if normalize_text(item)
    ]

    return any(
        normalize_text(term) == allergy
        for term in terms
        for allergy in allergy_items
    )


# =========================================================
# 6. PERSONALIZED INGREDIENT SUITABILITY
# =========================================================

def check_ingredient_suitability(
    ingredient_name,
    ingredient,
    skin_type=None,
    sensitivity=None,
    allergies=None,
    primary_concern=None,
):
    warnings = []

    if ingredient_matches_allergy(ingredient_name, allergies):
        return {
            "suitable": False,
            "reason": (
                "This ingredient matches the allergy information "
                "in your profile."
            ),
            "warnings": [
                "Avoid it until you have consulted a qualified healthcare professional."
            ],
        }

    if not concern_matches(ingredient, primary_concern):
        warnings.append(
            "This ingredient may not directly target your primary concern."
        )

    sensitivity_text = normalize_text(sensitivity)

    if sensitivity_text in {
        "high", "very high", "sensitive", "very sensitive"
    }:
        warnings.append(
            "Your profile indicates sensitivity. Introduce products "
            "cautiously and patch-test before regular use."
        )

    if normalize_text(ingredient_name) in {
        "retinoids", "aha", "salicylic acid"
    }:
        warnings.append(
            "This ingredient may irritate some skin types. Introduce gradually."
        )

    if not warnings:
        warnings.append(
            "Check the complete product label and discontinue use if irritation develops."
        )

    return {
        "suitable": True,
        "reason": (
            "No exact matching allergy entry was identified. "
            "This does not guarantee that the ingredient is safe for you."
        ),
        "warnings": warnings,
    }


def get_recommended_ingredients(
    primary_concern=None,
    skin_type=None,
    sensitivity=None,
    allergies=None,
):
    recommendations = []

    for name, ingredient in INGREDIENTS.items():
        suitability = check_ingredient_suitability(
            ingredient_name=name,
            ingredient=ingredient,
            skin_type=skin_type,
            sensitivity=sensitivity,
            allergies=allergies,
            primary_concern=primary_concern,
        )

        recommendations.append({
            "name": name,
            "category": ingredient["category"],
            "benefits": ingredient["benefits"],
            "education": ingredient["education"],
            "caution": ingredient["caution"],
            "suitable": suitability["suitable"],
            "reason": suitability["reason"],
            "warnings": suitability["warnings"],
        })

    return recommendations


# =========================================================
# 7. GEMINI JSON HELPER
# =========================================================
def generate_gemini_json(prompt):
    """Generate and parse a JSON object using the Gemini Interactions API."""

    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is missing from backend/.env"
        )

    client = genai.Client(api_key=api_key)
    last_error = None

    for attempt in range(3):
        try:
            interaction = client.interactions.create(
                model=model,
                input=(
                    prompt
                    + "\n\nReturn only one valid JSON object. "
                    "Do not include Markdown code fences."
                ),
            )

            response_text = getattr(interaction, "output_text", None)

            if not response_text or not response_text.strip():
                raise RuntimeError("Gemini returned an empty response.")

            # Handle optional Markdown fences safely.
            response_text = response_text.strip()
            if response_text.startswith("```"):
                response_text = response_text.split("\n", 1)[-1]
                if response_text.rstrip().endswith("```"):
                    response_text = response_text.rstrip()[:-3].strip()

            result = json.loads(response_text)

            if not isinstance(result, dict):
                raise RuntimeError("Gemini did not return a JSON object.")

            return result

        except Exception as exc:
            last_error = exc
            message = str(exc).lower()

            # Retry only temporary service/overload errors.
            temporary = any(
                term in message
                for term in (
                    "503",
                    "service_unavailable",
                    "high demand",
                    "429",
                    "resource_exhausted",
                    "500",
                    "internal server error",
                    "timeout",
                )
            )

            if not temporary or attempt == 2:
                print(
                    f"Gemini request failed: "
                    f"{type(exc).__name__}: {exc}"
                )
                break

            wait_seconds = 2 ** (attempt + 1)
            print(
                f"Temporary Gemini error. "
                f"Retrying in {wait_seconds} seconds..."
            )
            time.sleep(wait_seconds)

    raise RuntimeError(
        "Gemini is temporarily unavailable. Please try again later."
    ) from last_error
# =========================================================
# 8. INGREDIENT INTERACTION CHECKER
# =========================================================

def analyze_ingredient_interactions(ingredients):
    """
    Check ingredient compatibility.

    Accepts:
      - A list or tuple of ingredient names.
      - A single string.
      - A dictionary with ingredient1/ingredient2 or
        ingredient_1/ingredient_2.

    Known combinations are checked locally first.
    Gemini checks the combination when additional analysis is needed.
    """

    if isinstance(ingredients, dict):
        first = (
            ingredients.get("ingredient1")
            or ingredients.get("ingredient_1")
            or ingredients.get("first_ingredient")
        )

        second = (
            ingredients.get("ingredient2")
            or ingredients.get("ingredient_2")
            or ingredients.get("second_ingredient")
        )

        ingredient_list = [first, second]

    elif isinstance(ingredients, str):
        ingredient_list = [
            item.strip()
            for item in re.split(r"[,;|]", ingredients)
            if item.strip()
        ]

    elif isinstance(ingredients, (list, tuple)):
        ingredient_list = list(ingredients)

    else:
        raise ValueError(
            "Provide ingredient names as a list or dictionary."
        )

    ingredient_list = [
        str(item).strip()
        for item in ingredient_list
        if item is not None and str(item).strip()
    ]

    if len(ingredient_list) < 2:
        raise ValueError("Enter at least two ingredient names.")

    if len(ingredient_list) > 6:
        raise ValueError("Check no more than six ingredients at once.")

    canonical_names = [
        normalize_ingredient_name(name)
        for name in ingredient_list
    ]

    normalized_names = [
        normalize_text(name)
        for name in canonical_names
    ]

    if len(set(normalized_names)) != len(normalized_names):
        raise ValueError(
            "Enter different ingredients, not duplicate names or aliases."
        )

    # Check every unique pair using the local knowledge base.
    known_results = []
    total_pairs = len(canonical_names) * (len(canonical_names) - 1) // 2

    for index, first in enumerate(normalized_names):
        for second_index in range(index + 1, len(normalized_names)):
            second = normalized_names[second_index]

            message = INGREDIENT_INTERACTIONS.get(
                frozenset((first, second))
            )

            if message:
                known_results.append({
                    "ingredient_1": canonical_names[index],
                    "ingredient_2": canonical_names[second_index],
                    "level": "moderate",
                    "message": message,
                    "recommendation": (
                        "Consider alternating use and monitor your skin "
                        "for irritation."
                    ),
                    "source": "local_knowledge_base",
                })

    # If every pair has a known caution, no AI request is necessary.
    if len(known_results) == total_pairs:
        return {
            "success": True,
            "mode": "local_knowledge_base",
            "ingredients": canonical_names,
            "overall_status": "caution",
            "summary": "Known ingredient cautions were found.",
            "interactions": known_results,
            "safety_note": (
                "Compatibility depends on concentration, formulation, "
                "frequency, and individual skin sensitivity."
            ),
        }

    # Use Gemini to assess the combinations not covered by local rules.
    prompt = f"""
You are a cautious skincare ingredient compatibility assistant.

Evaluate these ingredients used in the same skincare routine:
{json.dumps(canonical_names)}

Return one valid JSON object with these fields:
- overall_status: one of "generally_compatible", "caution",
  "avoid_combination", or "uncertain"
- summary: a short explanation
- interactions: an array of objects, each containing:
  ingredient_1, ingredient_2, level, message, recommendation
- safety_note: a brief general safety statement

For level, use "low", "moderate", "high", or "uncertain".

Rules:
- Explain known potential irritation, stability, or formulation concerns.
- Do not claim ingredients are dangerous solely because they are
  used together.
- Do not invent research, citations, or clinical evidence.
- If evidence is insufficient or formulation-dependent, say so.
- Consider concentration, pH, formulation, frequency, and skin sensitivity.
- Do not diagnose, prescribe, or guarantee safety.
- Advise professional help for persistent reactions.
- Return JSON only.
"""

    try:
        ai_result = generate_gemini_json(prompt)

        status = normalize_text(ai_result.get("overall_status"))

        allowed_statuses = {
            "generally_compatible",
            "caution",
            "avoid_combination",
            "uncertain",
        }

        if status not in allowed_statuses:
            status = "uncertain"

        ai_interactions = ai_result.get("interactions", [])

        if not isinstance(ai_interactions, list):
            ai_interactions = []

        valid_ai_interactions = [
            item for item in ai_interactions
            if isinstance(item, dict)
        ]

        # Keep local cautions and add AI results without duplicating pairs.
        combined_interactions = list(known_results)
        known_pairs = {
            frozenset((
                normalize_text(item.get("ingredient_1")),
                normalize_text(item.get("ingredient_2")),
            ))
            for item in known_results
        }

        for item in valid_ai_interactions:
            pair = frozenset((
                normalize_text(item.get("ingredient_1")),
                normalize_text(item.get("ingredient_2")),
            ))

            if pair and pair not in known_pairs:
                combined_interactions.append(item)
                known_pairs.add(pair)

        # A known local caution should not be described as fully compatible.
        if known_results and status == "generally_compatible":
            status = "caution"

        return {
            "success": True,
            "mode": "gemini_ai",
            "ingredients": canonical_names,
            "overall_status": status,
            "summary": str(
                ai_result.get("summary")
                or "Review the interaction details below."
            ),
            "interactions": combined_interactions,
            "safety_note": str(
                ai_result.get("safety_note")
                or (
                    "AI-generated information is not a medical diagnosis "
                    "or a guarantee of compatibility."
                )
            ),
        }

    except Exception as exc:
        print(f"Gemini interaction analysis failed: {exc}")

        # Do not lose useful local cautions when the API fails.
        if known_results:
            return {
                "success": True,
                "mode": "local_knowledge_base",
                "ingredients": canonical_names,
                "overall_status": "caution",
                "summary": (
                    "Known cautions are available, but the AI check failed. "
                    "Remaining combinations are unverified."
                ),
                "interactions": known_results,
                "safety_note": (
                    "Check the backend logs. Unlisted combinations have "
                    "not been verified."
                ),
            }

        raise RuntimeError(
            "AI interaction analysis failed. Check your Gemini API key, "
            "model name, internet connection, and backend logs."
        ) from exc


# =========================================================
# 9. INGREDIENT EDUCATION WITH GEMINI FALLBACK
# =========================================================

def get_ingredient_education(ingredient_name):
    if not isinstance(ingredient_name, str) or not ingredient_name.strip():
        return {
            "ingredient": "",
            "message": "Please enter a valid ingredient name.",
        }

    search_name = ingredient_name.strip()
    canonical_name = normalize_ingredient_name(search_name)

    # Known ingredients are served locally without an API call.
    if canonical_name in INGREDIENTS:
        ingredient = INGREDIENTS[canonical_name]

        return {
            "ingredient": search_name,
            "category": ingredient["category"],
            "benefits": ingredient["benefits"],
            "education": ingredient["education"],
            "caution": ingredient["caution"],
            "source": "local_knowledge_base",
        }

    prompt = f"""
Provide general skincare ingredient education for: {search_name!r}

Return a JSON object with string fields:
category, benefits, education, caution.

Use accessible language. Mention evidence limitations and possible
irritation or safety precautions. Do not diagnose or promise results.
If the ingredient is ambiguous, explain that uncertainty.
Return JSON only.
"""

    try:
        education = generate_gemini_json(prompt)

        for field in ("category", "benefits", "education", "caution"):
            if (
                not isinstance(education.get(field), str)
                or not education[field].strip()
            ):
                raise RuntimeError(
                    f"Gemini returned an invalid '{field}' field."
                )

        return {
            "ingredient": search_name,
            "category": education["category"].strip(),
            "benefits": education["benefits"].strip(),
            "education": education["education"].strip(),
            "caution": education["caution"].strip(),
            "source": "gemini",
        }

    except Exception as exc:
        print(
            f"Gemini ingredient education failed for "
            f"{search_name!r}: {exc}"
        )

        raise RuntimeError(
            "Unable to generate ingredient education. Check the Gemini "
            "API key, model name, connection, and backend logs."
        ) from exc


# =========================================================
# 10. MAIN INGREDIENT ANALYSIS
# =========================================================

def analyze_ingredients(
    primary_concern=None,
    skin_type=None,
    sensitivity=None,
    allergies=None,
):
    recommendations = get_recommended_ingredients(
        primary_concern=primary_concern,
        skin_type=skin_type,
        sensitivity=sensitivity,
        allergies=allergies,
    )

    return {
        "primary_concern": primary_concern,
        "recommended_ingredients": recommendations,
        "total_ingredients": len(recommendations),
    }