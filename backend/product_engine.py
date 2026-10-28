import ast
import os
import re
from functools import lru_cache

import pandas as pd

from safety_engine import check_ingredient_safety
from ingredient_engine import predict_ingredient_ml_score


# =========================================================
# REAL PRODUCT DATASET
# =========================================================

PRODUCT_DATASET_PATH = (
    r"D:\skin\backend\SkinSense_ML_DataPipeline"
    r"\raw\sephora\product_info.csv"
)


# =========================================================
# NORMALIZATION
# =========================================================

def normalize_text(value):
    if value is None:
        return ""

    try:
        if pd.isna(value):
            return ""
    except Exception:
        pass

    return str(value).strip().lower()


def normalize_concern(concern):

    value = normalize_text(concern)

    mapping = {
        "dark spot": "Dark Spots",
        "dark spots": "Dark Spots",
        "hyperpigmentation": "Hyperpigmentation",
        "uneven tone": "Uneven Skin Tone",
        "uneven skin tone": "Uneven Skin Tone",
        "fine line": "Fine Lines",
        "fine lines": "Fine Lines",
        "dryness": "Dry Skin",
        "dry skin": "Dry Skin",
        "sensitive": "Sensitive Skin",
        "sensitive skin": "Sensitive Skin",
        "acne": "Acne",
        "redness": "Redness",
    }

    return mapping.get(
        value,
        str(concern).strip()
    )


def normalize_concerns(concerns):

    if not concerns:
        return []

    return list(
        dict.fromkeys(
            normalize_concern(concern)
            for concern in concerns
            if concern
        )
    )


# =========================================================
# INGREDIENT PARSER
# =========================================================

def parse_ingredients(value):

    if value is None:
        return []

    if isinstance(value, list):
        return value

    text = str(value).strip()

    if not text:
        return []

    try:
        parsed = ast.literal_eval(text)

        if isinstance(parsed, list):
            return parsed

    except Exception:
        pass

    return [text]


def clean_ingredient_name(value):

    if not value:
        return ""

    ingredient = str(value).strip()

    # Remove leading/trailing punctuation
    ingredient = ingredient.strip(" ,;")

    if not ingredient:
        return ""

    return ingredient


def clean_ingredient_block(block):
    """
    Sephora sometimes stores multi-product kits like:

    'A+ High-Dose Retinoid Serum:, Water, Propanediol, ...'

    The text before ':' is the PRODUCT COMPONENT NAME,
    not an ingredient.

    We remove that component label.
    """

    if not block:
        return ""

    block = str(block).strip()

    if not block:
        return ""

    # If the block begins with a component/product label
    # followed by ':', remove the label.
    #
    # Example:
    # 'Retinol Serum:, Water, Glycerin'
    #
    # becomes:
    # 'Water, Glycerin'

    if ":" in block:

        prefix, remainder = block.split(
            ":",
            1
        )

        prefix = prefix.strip()
        remainder = remainder.strip()

        # Product component labels are generally multi-word
        # and do not resemble normal INCI ingredient names.
        component_words = len(
            prefix.split()
        )

        component_indicators = [
            "serum",
            "cream",
            "cleanser",
            "gel",
            "lotion",
            "treatment",
            "mask",
            "oil",
            "balm",
            "moisturizer",
            "moisturiser",
            "peel",
            "toner",
            "essence",
            "eye",
            "pads",
            "wash",
        ]

        looks_like_product_component = (
            component_words >= 2
            or any(
                indicator in prefix.lower()
                for indicator in component_indicators
            )
        )

        if looks_like_product_component:
            return remainder

    return block


def extract_clean_ingredients(raw_value):

    raw_blocks = parse_ingredients(
        raw_value
    )

    ingredients = []

    for block in raw_blocks:

        if not block:
            continue

        cleaned_block = clean_ingredient_block(
            block
        )

        if not cleaned_block:
            continue

        # Split comma-separated INCI ingredients
        parts = cleaned_block.split(",")

        for part in parts:

            ingredient = clean_ingredient_name(
                part
            )

            if not ingredient:
                continue

            # Skip obvious component labels
            # that survived parsing.
            lower = normalize_text(
                ingredient
            )

            if lower.endswith(":"):
                continue

            if lower in {
                "ingredients",
                "ingredient",
                "key ingredients",
            }:
                continue

            ingredients.append(
                ingredient
            )

    # Deduplicate while preserving order
    return list(
        dict.fromkeys(
            ingredients
        )
    )


# =========================================================
# BOOLEAN PARSER
# =========================================================

def parse_bool(value):

    if isinstance(value, bool):
        return value

    if value is None:
        return False

    text = normalize_text(value)

    return text in {
        "true",
        "1",
        "yes",
        "y",
        "t",
    }


# =========================================================
# PRODUCT TYPE FILTERS
# =========================================================

EXCLUDED_PRODUCT_KEYWORDS = [

    # Kits / bundles / collections
    "kit",
    "set",
    "bundle",
    "collection",

    # Body
    "body",
    "body lotion",
    "body wash",
    "body scrub",
    "body cream",
    "body oil",
    "body serum",
    "ingrown hair",
    "bump treatment",

    # Hair
    "shampoo",
    "conditioner",
    "hair mask",
    "hair oil",
    "hair serum",
    "scalp",

    # Hands / feet
    "hand cream",
    "hand lotion",
    "foot cream",
    "foot lotion",

    # Lips
    "lip balm",
    "lip mask",
    "lip care",
    "lip treatment",

    # Nails
    "nail",

    # Bath
    "bath",

    # Fragrance
    "perfume",
    "parfum",
    "eau de",
    "cologne",

    # Makeup
    "foundation",
    "concealer",
    "mascara",
    "eyeliner",
    "lipstick",
    "lip gloss",
    "blush",
    "bronzer",
    "highlighter",
]


EXCLUDED_CATEGORY_KEYWORDS = [

    "body",
    "hair",
    "bath",
    "nail",
    "fragrance",
    "makeup",
    "tools",
]


def is_excluded_product(
    product_name,
    categories
):

    text = (
        normalize_text(product_name)
        + " "
        + normalize_text(categories)
    )

    for keyword in EXCLUDED_PRODUCT_KEYWORDS:

        if keyword in text:
            return True

    for keyword in EXCLUDED_CATEGORY_KEYWORDS:

        if keyword in normalize_text(categories):

            # Do not automatically reject a product
            # just because the category contains something
            # broad like "tools".
            if keyword != "tools":
                return True

    return False


def is_probable_kit(
    product_name,
    raw_ingredients
):

    name = normalize_text(
        product_name
    )

    kit_words = [
        "kit",
        "set",
        "bundle",
        "collection",
    ]

    if any(
        word in name
        for word in kit_words
    ):
        return True

    # Count component product labels.
    component_count = 0

    for block in parse_ingredients(
        raw_ingredients
    ):

        block_text = str(
            block
        ).strip()

        if block_text.endswith(":"):
            component_count += 1

    return component_count >= 2


# =========================================================
# PRICE TIER
# =========================================================

def get_price_tier(price):

    if price is None:
        return "Price unavailable"

    if price <= 30:
        return "Budget"

    if price <= 60:
        return "Mid-range"

    return "Premium"


# =========================================================
# LOAD REAL PRODUCT DATABASE
# =========================================================

def load_product_database():

    if not os.path.exists(
        PRODUCT_DATASET_PATH
    ):

        print(
            "WARNING: Real Sephora product dataset "
            "was not found:"
        )

        print(
            PRODUCT_DATASET_PATH
        )

        return []

    try:

        df = pd.read_csv(
            PRODUCT_DATASET_PATH,
            low_memory=False
        )

    except Exception as error:

        print(
            "ERROR loading product dataset:",
            error
        )

        return []

    products = []

    # -----------------------------------------------------
    # REAL SKINCARE CATEGORY FILTER
    # -----------------------------------------------------

    skincare_keywords = [

        "skincare",
        "skin care",

        "cleanser",
        "cleansing",

        "moisturizer",
        "moisturiser",

        "serum",
        "treatment",

        "face mask",
        "facial mask",

        "toner",
        "essence",

        "face oil",
        "facial oil",

        "sunscreen",
        "sun care",
        "spf",

        "face cream",
        "face lotion",

        "exfoliant",
        "exfoliator",
        "peel",

        "ampoule",
    ]

    # -----------------------------------------------------
    # PROCESS
    # -----------------------------------------------------

    for _, row in df.iterrows():

        product_name = str(
            row.get(
                "product_name",
                ""
            )
        ).strip()

        brand_name = str(
            row.get(
                "brand_name",
                ""
            )
        ).strip()

        if not product_name:
            continue

        if not brand_name:
            brand_name = "Unknown Brand"

        categories = " ".join(
            [
                str(
                    row.get(
                        "primary_category",
                        ""
                    )
                ),

                str(
                    row.get(
                        "secondary_category",
                        ""
                    )
                ),

                str(
                    row.get(
                        "tertiary_category",
                        ""
                    )
                ),
            ]
        )

        product_text = (
            product_name
            + " "
            + categories
        ).lower()

        # -------------------------------------------------
        # ONLY SKINCARE
        # -------------------------------------------------

        is_skincare = any(
            keyword in product_text
            for keyword in skincare_keywords
        )

        if not is_skincare:
            continue

        # -------------------------------------------------
        # REMOVE BODY / HAIR / FRAGRANCE / KITS
        # -------------------------------------------------

        if is_excluded_product(
            product_name,
            categories
        ):
            continue

        raw_ingredients = row.get(
            "ingredients"
        )

        if is_probable_kit(
            product_name,
            raw_ingredients
        ):
            continue

        # -------------------------------------------------
        # CLEAN INGREDIENTS
        # -------------------------------------------------

        ingredients = extract_clean_ingredients(
            raw_ingredients
        )

        if not ingredients:
            continue

        # -------------------------------------------------
        # PRICE
        # -------------------------------------------------

        price = pd.to_numeric(
            row.get("price_usd"),
            errors="coerce"
        )

        if pd.isna(price):

            price = pd.to_numeric(
                row.get("sale_price_usd"),
                errors="coerce"
            )

        if pd.isna(price):
            price = None
        else:
            price = float(price)

        price_tier = get_price_tier(
            price
        )

        # -------------------------------------------------
        # RATING
        # -------------------------------------------------

        rating = pd.to_numeric(
            row.get("rating"),
            errors="coerce"
        )

        if pd.isna(rating):
            rating = None
        else:
            rating = float(rating)

        # -------------------------------------------------
        # REVIEWS
        # -------------------------------------------------

        reviews = pd.to_numeric(
            row.get("reviews"),
            errors="coerce"
        )

        if pd.isna(reviews):
            reviews = 0
        else:
            reviews = int(reviews)

        # -------------------------------------------------
        # PRODUCT
        # -------------------------------------------------

        products.append(
            {
                "product_id": str(
                    row.get(
                        "product_id",
                        ""
                    )
                ),

                "brand": brand_name,

                "name": product_name,

                "category": (
                    str(
                        row.get(
                            "primary_category",
                            ""
                        )
                    ).strip()
                    or "Skincare"
                ),

                "subcategory": (
                    str(
                        row.get(
                            "secondary_category",
                            ""
                        )
                    ).strip()
                    or ""
                ),

                "ingredients": ingredients,

                "price_usd": price,

                "price_tier": price_tier,

                "rating": rating,

                "reviews": reviews,

                "online_only": parse_bool(
                    row.get(
                        "online_only",
                        False
                    )
                ),

                "out_of_stock": parse_bool(
                    row.get(
                        "out_of_stock",
                        False
                    )
                ),
            }
        )

    print(
        f"Loaded {len(products)} "
        f"clean real skincare products."
    )

    return products


# =========================================================
# LOAD ONCE
# =========================================================

PRODUCT_DATABASE = load_product_database()


# =========================================================
# CONCERN → INGREDIENT KEYWORDS
# =========================================================

CONCERN_INGREDIENTS = {

    "Acne": [
        "salicylic acid",
        "benzoyl peroxide",
        "niacinamide",
        "azelaic acid",
        "adapalene",
        "retinol",
        "retinal",
        "retinoid",
    ],

    "Dark Spots": [
        "vitamin c",
        "ascorbic acid",
        "niacinamide",
        "alpha arbutin",
        "tranexamic acid",
        "kojic acid",
    ],

    "Hyperpigmentation": [
        "vitamin c",
        "ascorbic acid",
        "niacinamide",
        "alpha arbutin",
        "tranexamic acid",
        "kojic acid",
    ],

    "Redness": [
        "centella",
        "panthenol",
        "allantoin",
        "niacinamide",
        "ceramide",
        "madecassoside",
    ],

    "Dry Skin": [
        "hyaluronic acid",
        "ceramide",
        "squalane",
        "glycerin",
        "panthenol",
    ],

    "Fine Lines": [
        "retinol",
        "retinal",
        "retinoid",
        "peptide",
        "hyaluronic acid",
        "vitamin c",
    ],

    "Uneven Skin Tone": [
        "niacinamide",
        "vitamin c",
        "ascorbic acid",
        "alpha arbutin",
        "tranexamic acid",
        "kojic acid",
    ],
}


# =========================================================
# INGREDIENT MATCHING
# =========================================================

def ingredient_matches_concern(
    ingredient,
    concerns
):

    text = normalize_text(
        ingredient
    )

    matches = []

    for concern in concerns:

        for keyword in CONCERN_INGREDIENTS.get(
            concern,
            []
        ):

            if keyword in text:

                matches.append(
                    concern
                )

                break

    return list(
        dict.fromkeys(
            matches
        )
    )


def get_product_concern_matches(
    product,
    concerns
):

    matches = []

    for ingredient in product.get(
        "ingredients",
        []
    ):

        matches.extend(
            ingredient_matches_concern(
                ingredient,
                concerns
            )
        )

    return list(
        dict.fromkeys(
            matches
        )
    )


# =========================================================
# SPECIAL SAFE-INGREDIENT MATCHING
# =========================================================

def safe_ingredient_matches_product(
    safe_name,
    product_ingredient
):

    safe = normalize_text(
        safe_name
    )

    product = normalize_text(
        product_ingredient
    )

    if not safe or not product:
        return False

    # -----------------------------------------------------
    # IMPORTANT:
    # "BHA" is ambiguous.
    #
    # BHA can mean beta hydroxy acid,
    # but cosmetic ingredient lists may also use
    # BHA to refer to Butylated Hydroxyanisole.
    #
    # Therefore we DO NOT match literal "BHA".
    # We only match actual salicylic/beta-hydroxy signals.
    # -----------------------------------------------------

    if safe == "bha":

        return (
            "salicylic acid" in product
            or "beta hydroxy acid" in product
            or "beta-hydroxy acid" in product
        )

    if safe == "aha":

        return (
            "glycolic acid" in product
            or "lactic acid" in product
            or "mandelic acid" in product
            or "alpha hydroxy acid" in product
        )

    # Normal matching
    return (
        safe in product
    )


def find_safe_ingredient_matches(
    product,
    safe_ingredient_names
):

    matches = []

    for ingredient in product.get(
        "ingredients",
        []
    ):

        for safe_name in safe_ingredient_names:

            if safe_ingredient_matches_product(
                safe_name,
                ingredient
            ):

                matches.append(
                    ingredient
                )

                break

    return list(
        dict.fromkeys(
            matches
        )
    )


# =========================================================
# KEY INGREDIENTS
# =========================================================

def get_key_ingredients(
    product,
    concerns,
    safe_ingredient_names
):

    ingredients = product.get(
        "ingredients",
        []
    )

    key = []

    # 1. Concern-relevant ingredients
    for ingredient in ingredients:

        if ingredient_matches_concern(
            ingredient,
            concerns
        ):

            key.append(
                ingredient
            )

    # 2. Recommended ingredients
    for ingredient in ingredients:

        for safe_name in safe_ingredient_names:

            if safe_ingredient_matches_product(
                safe_name,
                ingredient
            ):

                key.append(
                    ingredient
                )

                break

    # 3. Deduplicate
    key = list(
        dict.fromkeys(
            key
        )
    )

    # 4. Return a reasonable display amount
    return key[:8]


# =========================================================
# CACHED ML SCORE
# =========================================================

@lru_cache(
    maxsize=20000
)
def cached_ingredient_ml_score(
    ingredient,
    skin_type
):

    if not ingredient:
        return None

    if len(ingredient) < 3:
        return None

    try:

        return float(
            predict_ingredient_ml_score(
                ingredient_name=ingredient,
                skin_type=skin_type
            )
        )

    except Exception:

        return None


# =========================================================
# CACHED SAFETY CHECK
# =========================================================

@lru_cache(
    maxsize=50000
)
def cached_safety_check(
    ingredient,
    allergies,
    sensitivity
):

    return check_ingredient_safety(
        ingredient=ingredient,
        allergies=allergies,
        sensitivity=sensitivity
    )


# =========================================================
# PRODUCT ML SCORE
# =========================================================

def calculate_ml_ingredient_score(
    product,
    skin_type
):

    ingredients = product.get(
        "ingredients",
        []
    )

    if not ingredients:
        return 0, []

    scores = []

    ml_details = []

    for ingredient in ingredients:

        ml_score = cached_ingredient_ml_score(
            ingredient,
            skin_type
        )

        if ml_score is None:
            continue

        scores.append(
            ml_score
        )

        ml_details.append(
            {
                "ingredient": ingredient,
                "ml_score": round(
                    ml_score,
                    2
                )
            }
        )

    if not scores:
        return 0, ml_details

    best_score = max(
        scores
    )

    return (
        round(
            best_score,
            2
        ),
        ml_details
    )


# =========================================================
# PRODUCT SCORING
# =========================================================

def calculate_product_score(
    product,
    skin_type,
    concerns,
    safe_ingredient_names=None,
    prioritized_concerns=None,
    precomputed_concern_matches=None,
):

    safe_ingredient_names = (
        safe_ingredient_names or []
    )

    concerns = normalize_concerns(
        concerns
    )

    score = 0

    reasons = []

    # -----------------------------------------------------
    # 1. CONCERN MATCH
    # -----------------------------------------------------

    if precomputed_concern_matches is not None:

        product_concern_matches = (
            precomputed_concern_matches
        )

    else:

        product_concern_matches = (
            get_product_concern_matches(
                product,
                concerns
            )
        )

    concern_score = min(
        len(product_concern_matches) * 15,
        30
    )

    score += concern_score

    if product_concern_matches:

        reasons.append(
            "Targets: "
            + ", ".join(
                product_concern_matches
            )
        )

    # -----------------------------------------------------
    # 2. SAFE INGREDIENT MATCH
    # -----------------------------------------------------

    ingredient_matches = (
        find_safe_ingredient_matches(
            product,
            safe_ingredient_names
        )
    )

    ingredient_component = min(
        len(ingredient_matches) * 10,
        20
    )

    score += ingredient_component

    if ingredient_matches:

        reasons.append(
            "Contains recommended "
            "ingredient(s): "
            + ", ".join(
                ingredient_matches[:5]
            )
        )

    # -----------------------------------------------------
    # 3. ML SCORE
    # -----------------------------------------------------

    ml_score, ml_details = (
        calculate_ml_ingredient_score(
            product,
            skin_type
        )
    )

    ml_component = (
        ml_score * 0.20
    )

    score += ml_component

    if ml_score:

        reasons.append(
            "Ingredient suitability score: "
            f"{ml_score}%."
        )

    # -----------------------------------------------------
    # 4. RATING
    # -----------------------------------------------------

    rating = product.get(
        "rating"
    )

    if rating is not None:

        score += min(
            (rating / 5) * 5,
            5
        )

    # -----------------------------------------------------
    # 5. REVIEWS
    # -----------------------------------------------------

    reviews = product.get(
        "reviews",
        0
    )

    if reviews >= 1000:
        score += 5

    elif reviews >= 500:
        score += 4

    elif reviews >= 100:
        score += 3

    elif reviews >= 25:
        score += 2

    elif reviews > 0:
        score += 1

    # -----------------------------------------------------
    # 6. PRIORITY CONCERNS
    # -----------------------------------------------------

    priority_matches = []

    if prioritized_concerns:

        priority_names = []

        for item in prioritized_concerns:

            if isinstance(item, dict):

                value = item.get(
                    "concern"
                )

                if value:

                    priority_names.append(
                        normalize_concern(
                            value
                        )
                    )

            else:

                priority_names.append(
                    normalize_concern(
                        item
                    )
                )

        priority_matches = [
            concern
            for concern in product_concern_matches
            if concern in priority_names
        ]

        score += min(
            len(priority_matches) * 5,
            10
        )

        if priority_matches:

            reasons.append(
                "Matches prioritized "
                "concern(s): "
                + ", ".join(
                    priority_matches
                )
            )

    # -----------------------------------------------------
    # FINAL
    # -----------------------------------------------------

    score = round(
        min(
            score,
            100
        ),
        2
    )

    personalized_match = (
        bool(product_concern_matches)
        or bool(ingredient_matches)
        or bool(ml_score)
    )

    return {
        "score": score,
        "reasons": reasons,
        "ml_score": ml_score,
        "ml_details": ml_details,
        "matching_concerns": (
            product_concern_matches
        ),
        "priority_matches": (
            priority_matches
        ),
        "ingredient_matches": (
            ingredient_matches
        ),
        "personalized_match": (
            personalized_match
        ),
    }


# =========================================================
# PRODUCT SAFETY
# =========================================================

def evaluate_product_safety(
    product,
    allergies="",
    sensitivity=""
):

    if not allergies and not sensitivity:

        return {
            "status": "REVIEW",
            "results": [],
            "reason": (
                "No matching reported allergy "
                "or sensitivity was found. "
                "Always check the complete "
                "ingredient list before use."
            )
        }

    safety_results = []

    for ingredient in product.get(
        "ingredients",
        []
    ):

        safety = cached_safety_check(
            ingredient,
            allergies,
            sensitivity
        )

        safety_results.append(
            safety
        )

    avoided = [
        result
        for result in safety_results
        if result["status"] == "AVOID"
    ]

    flagged = [
        result
        for result in safety_results
        if result["status"] == "FLAGGED"
    ]

    if avoided:

        return {
            "status": "AVOID",
            "results": safety_results,
            "reason": (
                "Product contains an "
                "ingredient that conflicts "
                "with a reported allergy."
            )
        }

    if flagged:

        return {
            "status": "FLAGGED",
            "results": safety_results,
            "reason": (
                "Product contains an "
                "ingredient that requires "
                "additional caution based "
                "on the reported sensitivity."
            )
        }

    return {
        "status": "REVIEW",
        "results": safety_results,
        "reason": (
            "No matching reported allergy "
            "or sensitivity was found. "
            "Always check the complete "
            "ingredient list before use."
        )
    }


# =========================================================
# BUILD PRODUCT RESPONSE
# =========================================================

def build_product_response(
    product,
    result,
    safety,
    concerns,
    safe_ingredient_names
):

    key_ingredients = get_key_ingredients(
        product,
        concerns,
        safe_ingredient_names
    )

    return {
        "product_id": product[
            "product_id"
        ],

        "brand": product[
            "brand"
        ],

        "name": product[
            "name"
        ],

        "category": product[
            "category"
        ],

        "subcategory": product[
            "subcategory"
        ],

        # Keep full ingredients available for
        # backend/detail-page use.
        "ingredients": product[
            "ingredients"
        ],

        # Frontend should display this.
        "key_ingredients": key_ingredients,

        "price_usd": product[
            "price_usd"
        ],

        "price_tier": product[
            "price_tier"
        ],

        "rating": product[
            "rating"
        ],

        "reviews": product[
            "reviews"
        ],

        "online_only": product[
            "online_only"
        ],

        "score": result[
            "score"
        ],

        "ml_score": result[
            "ml_score"
        ],

        "ml_details": result[
            "ml_details"
        ],

        "matching_concerns": result[
            "matching_concerns"
        ],

        "priority_matches": result[
            "priority_matches"
        ],

        "ingredient_matches": result[
            "ingredient_matches"
        ],

        "safety_status": safety[
            "status"
        ],

        "safety_reason": safety[
            "reason"
        ],

        "reason": " ".join(
            result[
                "reasons"
            ]
        ),
    }


# =========================================================
# PRODUCT RECOMMENDATION ENGINE
# =========================================================

def get_product_recommendations(
    skin_type,
    concerns,
    safe_ingredients=None,
    budget=None,
    allergies="",
    sensitivity="",
    prioritized_concerns=None
):

    safe_ingredients = (
        safe_ingredients or []
    )

    concerns = normalize_concerns(
        concerns
    )

    safe_ingredient_names = [
        item["ingredient"]
        for item in safe_ingredients
        if item.get(
            "safety_status",
            "REVIEW"
        ) != "AVOID"
    ]

    recommendations = []

    flagged_products = []

    avoided_products = []

    # =====================================================
    # STAGE 1 — QUICK CANDIDATE GENERATION
    # =====================================================

    candidates = []

    for product in PRODUCT_DATABASE:

        if product.get(
            "out_of_stock",
            False
        ):
            continue

        concern_matches = (
            get_product_concern_matches(
                product,
                concerns
            )
        )

        safe_matches = (
            find_safe_ingredient_matches(
                product,
                safe_ingredient_names
            )
        )

        # -------------------------------------------------
        # USER HAS CONCERNS
        #
        # Product must have an actual relevant ingredient
        # or one of the recommended ingredients.
        # -------------------------------------------------

        if concerns:

            if (
                not concern_matches
                and not safe_matches
            ):
                continue

        candidates.append(
            (
                product,
                concern_matches
            )
        )

    # =====================================================
    # STAGE 2 — CHEAP RANKING
    # =====================================================

    candidates.sort(
        key=lambda item: (
            len(item[1]),
            item[0].get("rating") or 0,
            item[0].get("reviews") or 0,
        ),
        reverse=True
    )

    # Keep ML workload manageable.
    candidates = candidates[:500]

    # =====================================================
    # STAGE 3 — PERSONALIZED SCORING
    # =====================================================

    for product, concern_matches in candidates:

        # -------------------------------------------------
        # SAFETY
        # -------------------------------------------------

        safety = evaluate_product_safety(
            product=product,
            allergies=allergies,
            sensitivity=sensitivity
        )

        # -------------------------------------------------
        # HARD ALLERGY REJECTION
        # -------------------------------------------------

        if safety["status"] == "AVOID":

            avoided_products.append(
                build_product_response(
                    product=product,
                    result={
                        "score": 0,
                        "ml_score": 0,
                        "ml_details": [],
                        "matching_concerns": [],
                        "priority_matches": [],
                        "ingredient_matches": [],
                        "reasons": [],
                    },
                    safety=safety,
                    concerns=concerns,
                    safe_ingredient_names=(
                        safe_ingredient_names
                    )
                )
            )

            continue

        # -------------------------------------------------
        # SCORE
        # -------------------------------------------------

        result = calculate_product_score(
            product=product,
            skin_type=skin_type,
            concerns=concerns,
            safe_ingredient_names=(
                safe_ingredient_names
            ),
            prioritized_concerns=(
                prioritized_concerns
            ),
            precomputed_concern_matches=(
                concern_matches
            )
        )

        score = result[
            "score"
        ]

        # -------------------------------------------------
        # FLAGGED
        # -------------------------------------------------

        if safety["status"] == "FLAGGED":

            flagged_products.append(
                build_product_response(
                    product=product,
                    result=result,
                    safety=safety,
                    concerns=concerns,
                    safe_ingredient_names=(
                        safe_ingredient_names
                    )
                )
            )

            continue

        # -------------------------------------------------
        # RECOMMENDATION
        # -------------------------------------------------

        if (
            score >= 35
            and result[
                "personalized_match"
            ]
        ):

            recommendations.append(
                build_product_response(
                    product=product,
                    result=result,
                    safety=safety,
                    concerns=concerns,
                    safe_ingredient_names=(
                        safe_ingredient_names
                    )
                )
            )

    # =====================================================
    # SORT
    # =====================================================

    recommendations.sort(
        key=lambda item: (
            item["score"],
            item.get("rating") or 0,
            item.get("reviews") or 0,
        ),
        reverse=True
    )

    flagged_products.sort(
        key=lambda item: (
            item["score"],
            item.get("rating") or 0,
        ),
        reverse=True
    )

    # =====================================================
    # RESULT
    # =====================================================

    return {
        "recommended": recommendations[:10],
        "flagged": flagged_products[:5],
        "avoid": avoided_products[:10],
    }


# =========================================================
# DEBUG / CACHE INFO
# =========================================================

def get_product_engine_cache_info():

    return {
        "ml_cache": (
            cached_ingredient_ml_score
            .cache_info()
            ._asdict()
        ),

        "safety_cache": (
            cached_safety_check
            .cache_info()
            ._asdict()
        ),

        "product_count": len(
            PRODUCT_DATABASE
        ),
    }