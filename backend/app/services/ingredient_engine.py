# # =========================================================
# # INGREDIENT INTELLIGENCE ENGINE
# # =========================================================


# # ---------------------------------------------------------
# # INGREDIENT KNOWLEDGE BASE
# # ---------------------------------------------------------

# INGREDIENTS = {

#     "Salicylic Acid": {
#         "benefits": "Helps unclog pores and manage acne-prone and oily skin.",
#         "concerns": [
#             "Acne",
#             "Oily Skin",
#             "Oiliness"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination"
#         ],
#         "caution": (
#             "May cause dryness or irritation, "
#             "especially on sensitive skin."
#         ),
#     },

#     "Niacinamide": {
#         "benefits": (
#             "Supports skin barrier function and helps "
#             "with oil control and uneven skin appearance."
#         ),
#         "concerns": [
#             "Acne",
#             "Oily Skin",
#             "Oiliness",
#             "Redness/Sensitivity",
#             "Dullness",
#             "Hyperpigmentation",
#             "Dark Spots"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry",
#             "sensitive"
#         ],
#         "caution": (
#             "Generally well tolerated, but sensitive skin "
#             "should start gradually."
#         ),
#     },

#     "Vitamin C": {
#         "benefits": (
#             "Provides antioxidant support and helps improve "
#             "the appearance of uneven skin tone."
#         ),
#         "concerns": [
#             "Hyperpigmentation",
#             "Dark Spots",
#             "Dullness"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry"
#         ],
#         "caution": (
#             "Some sensitive skin may experience irritation."
#         ),
#     },

#     "Hyaluronic Acid": {
#         "benefits": (
#             "Helps attract and retain moisture in the skin."
#         ),
#         "concerns": [
#             "Dry Skin",
#             "Dryness",
#             "Fine Lines",
#             "Fine Lines/Aging",
#             "Dullness"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry",
#             "sensitive"
#         ],
#         "caution": (
#             "Usually gentle, but discontinue if irritation occurs."
#         ),
#     },

#     "Ceramides": {
#         "benefits": (
#             "Helps support and maintain the skin barrier."
#         ),
#         "concerns": [
#             "Dry Skin",
#             "Dryness",
#             "Sensitive Skin",
#             "Redness/Sensitivity",
#             "Fine Lines",
#             "Fine Lines/Aging"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry",
#             "sensitive"
#         ],
#         "caution": (
#             "Generally suitable for barrier-supportive skincare."
#         ),
#     },

#     "Panthenol": {
#         "benefits": (
#             "Helps support hydration and soothe the skin."
#         ),
#         "concerns": [
#             "Sensitive Skin",
#             "Redness/Sensitivity",
#             "Dry Skin",
#             "Dryness"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry",
#             "sensitive"
#         ],
#         "caution": (
#             "Generally gentle, but individual reactions can vary."
#         ),
#     },

#     "Centella": {
#         "benefits": (
#             "Commonly used in soothing and "
#             "skin-barrier-supportive products."
#         ),
#         "concerns": [
#             "Sensitive Skin",
#             "Redness/Sensitivity"
#         ],
#         "suitable_skin_types": [
#             "sensitive",
#             "dry",
#             "normal",
#             "combination"
#         ],
#         "caution": (
#             "Stop use if irritation or an allergic reaction occurs."
#         ),
#     },

#     "Peptides": {
#         "benefits": (
#             "Used in skincare formulations that support "
#             "the appearance of skin firmness."
#         ),
#         "concerns": [
#             "Fine Lines",
#             "Fine Lines/Aging",
#             "Wrinkles"
#         ],
#         "suitable_skin_types": [
#             "oily",
#             "combination",
#             "normal",
#             "dry",
#             "sensitive"
#         ],
#         "caution": (
#             "Check the complete product formulation for other "
#             "potentially irritating ingredients."
#         ),
#     },
# }


# # ---------------------------------------------------------
# # NORMALIZE TEXT
# # ---------------------------------------------------------

# def normalize_text(value):

#     if value is None:
#         return ""

#     return str(value).strip().lower()


# # ---------------------------------------------------------
# # NORMALIZE CONCERN
# # ---------------------------------------------------------

# def concern_matches(
#     primary_concern,
#     ingredient_concerns
# ):

#     primary = normalize_text(
#         primary_concern
#     )

#     for concern in ingredient_concerns:

#         if primary == normalize_text(
#             concern
#         ):
#             return True

#     return False


# # ---------------------------------------------------------
# # CHECK ALLERGY
# # ---------------------------------------------------------

# def ingredient_matches_allergy(
#     ingredient_name,
#     allergies
# ):

#     if not allergies:
#         return False

#     ingredient_name = normalize_text(
#         ingredient_name
#     )

#     allergy_text = normalize_text(
#         allergies
#     )

#     return ingredient_name in allergy_text


# # ---------------------------------------------------------
# # CHECK INGREDIENT SUITABILITY
# # ---------------------------------------------------------

# def check_ingredient_suitability(
#     ingredient_name,
#     skin_type,
#     sensitivity,
#     allergies
# ):

#     ingredient = INGREDIENTS.get(
#         ingredient_name
#     )

#     if not ingredient:

#         return {
#             "suitable": False,
#             "reason": "Ingredient information not available."
#         }


#     # -----------------------------------------------------
#     # ALLERGY CHECK
#     # -----------------------------------------------------

#     if ingredient_matches_allergy(
#         ingredient_name,
#         allergies
#     ):

#         return {
#             "suitable": False,
#             "reason": (
#                 "Ingredient matches a reported allergy."
#             )
#         }


#     # -----------------------------------------------------
#     # SKIN TYPE CHECK
#     # -----------------------------------------------------

#     normalized_skin_type = normalize_text(
#         skin_type
#     )

#     suitable_skin_types = [
#         normalize_text(item)
#         for item in ingredient[
#             "suitable_skin_types"
#         ]
#     ]

#     if (
#         normalized_skin_type
#         and normalized_skin_type
#         not in suitable_skin_types
#     ):

#         return {
#             "suitable": False,
#             "reason": (
#                 "Ingredient may not be the best "
#                 "match for this skin type."
#             )
#         }


#     # -----------------------------------------------------
#     # SENSITIVITY CHECK
#     # -----------------------------------------------------

#     normalized_sensitivity = normalize_text(
#         sensitivity
#     )


#     if (
#         normalized_sensitivity == "high"
#         and ingredient_name in [
#             "Salicylic Acid",
#             "Vitamin C"
#         ]
#     ):

#         return {
#             "suitable": True,
#             "reason": (
#                 "Potentially useful, but high sensitivity "
#                 "requires extra caution and gradual use."
#             )
#         }


#     return {
#         "suitable": True,
#         "reason": ingredient["caution"]
#     }


# # ---------------------------------------------------------
# # GET RECOMMENDED INGREDIENTS
# # ---------------------------------------------------------

# def get_recommended_ingredients(
#     primary_concern,
#     skin_type,
#     sensitivity=None,
#     allergies=None
# ):

#     recommendations = []


#     if not primary_concern:
#         return recommendations


#     for ingredient_name, data in INGREDIENTS.items():

#         # Check whether ingredient is useful
#         # for the primary concern.

#         if not concern_matches(
#             primary_concern,
#             data["concerns"]
#         ):

#             continue


#         # Check suitability

#         suitability = check_ingredient_suitability(

#             ingredient_name=ingredient_name,

#             skin_type=skin_type,

#             sensitivity=sensitivity,

#             allergies=allergies,

#         )


#         if not suitability["suitable"]:
#             continue


#         recommendations.append({

#             "ingredient": ingredient_name,

#             "benefits": data["benefits"],

#             "reason": suitability["reason"],

#         })


#     return recommendations


# # ---------------------------------------------------------
# # MAIN INGREDIENT ANALYSIS
# # ---------------------------------------------------------

# def analyze_ingredients(
#     primary_concern,
#     skin_type,
#     sensitivity=None,
#     allergies=None
# ):

#     recommended = get_recommended_ingredients(

#         primary_concern=primary_concern,

#         skin_type=skin_type,

#         sensitivity=sensitivity,

#         allergies=allergies,

#     )


#     return {

#         "primary_concern": primary_concern,

#         "recommended_ingredients": recommended,

#         "total_recommended": len(
#             recommended
#         ),

#     }
# =========================================================
# INGREDIENT INTELLIGENCE ENGINE
# =========================================================


# ---------------------------------------------------------
# INGREDIENT KNOWLEDGE BASE
# ---------------------------------------------------------

INGREDIENTS = {

    "Salicylic Acid": {
        "category": "AHAs/BHAs",
        "benefits": (
            "Helps unclog pores and manage acne-prone "
            "and oily skin."
        ),
        "concerns": [
            "Acne",
            "Oily Skin",
            "Oiliness"
        ],
        "suitable_skin_types": [
            "oily",
            "combination"
        ],
        "caution": (
            "May cause dryness or irritation, "
            "especially on sensitive skin."
        ),
        "education": (
            "Salicylic Acid is a beta hydroxy acid (BHA) "
            "commonly used for clogged pores and acne-prone skin."
        ),
    },

    "Niacinamide": {
        "category": "Niacinamide",
        "benefits": (
            "Supports skin barrier function and helps "
            "with oil control and uneven skin appearance."
        ),
        "concerns": [
            "Acne",
            "Oily Skin",
            "Oiliness",
            "Redness/Sensitivity",
            "Dullness",
            "Hyperpigmentation",
            "Dark Spots"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry",
            "sensitive"
        ],
        "caution": (
            "Generally well tolerated, but sensitive skin "
            "should start gradually."
        ),
        "education": (
            "Niacinamide is a form of vitamin B3 commonly "
            "used to support the skin barrier and manage oiliness."
        ),
    },

    "Vitamin C": {
        "category": "Vitamin C",
        "benefits": (
            "Provides antioxidant support and helps improve "
            "the appearance of uneven skin tone."
        ),
        "concerns": [
            "Hyperpigmentation",
            "Dark Spots",
            "Dullness",
            "Uneven Skin Tone"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry"
        ],
        "caution": (
            "Some sensitive skin may experience irritation."
        ),
        "education": (
            "Vitamin C is an antioxidant commonly used in "
            "skincare to support brighter and more even-looking skin."
        ),
    },

    "Hyaluronic Acid": {
        "category": "Hyaluronic Acid",
        "benefits": (
            "Helps attract and retain moisture in the skin."
        ),
        "concerns": [
            "Dry Skin",
            "Dryness",
            "Fine Lines",
            "Fine Lines/Aging",
            "Dullness"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry",
            "sensitive"
        ],
        "caution": (
            "Usually gentle, but discontinue if irritation occurs."
        ),
        "education": (
            "Hyaluronic Acid is a hydrating ingredient that "
            "helps the skin retain moisture."
        ),
    },

    "Ceramides": {
        "category": "Ceramides",
        "benefits": (
            "Helps support and maintain the skin barrier."
        ),
        "concerns": [
            "Dry Skin",
            "Dryness",
            "Sensitive Skin",
            "Redness/Sensitivity",
            "Fine Lines",
            "Fine Lines/Aging"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry",
            "sensitive"
        ],
        "caution": (
            "Generally suitable for barrier-supportive skincare."
        ),
        "education": (
            "Ceramides are lipids that help support the "
            "skin barrier and reduce moisture loss."
        ),
    },

    "Panthenol": {
        "category": "Soothing Ingredients",
        "benefits": (
            "Helps support hydration and soothe the skin."
        ),
        "concerns": [
            "Sensitive Skin",
            "Redness/Sensitivity",
            "Dry Skin",
            "Dryness"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry",
            "sensitive"
        ],
        "caution": (
            "Generally gentle, but individual reactions can vary."
        ),
        "education": (
            "Panthenol is commonly used in skincare products "
            "to support hydration and soothing."
        ),
    },

    "Centella": {
        "category": "Soothing Ingredients",
        "benefits": (
            "Commonly used in soothing and "
            "skin-barrier-supportive products."
        ),
        "concerns": [
            "Sensitive Skin",
            "Redness/Sensitivity"
        ],
        "suitable_skin_types": [
            "sensitive",
            "dry",
            "normal",
            "combination"
        ],
        "caution": (
            "Stop use if irritation or an allergic reaction occurs."
        ),
        "education": (
            "Centella is commonly used in skincare formulations "
            "designed to soothe and support the skin barrier."
        ),
    },

    "Peptides": {
        "category": "Peptides",
        "benefits": (
            "Used in skincare formulations that support "
            "the appearance of skin firmness."
        ),
        "concerns": [
            "Fine Lines",
            "Fine Lines/Aging",
            "Wrinkles"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal",
            "dry",
            "sensitive"
        ],
        "caution": (
            "Check the complete product formulation for other "
            "potentially irritating ingredients."
        ),
        "education": (
            "Peptides are commonly used in skincare products "
            "formulated to support the appearance of firmness."
        ),
    },

    "Retinoids": {
        "category": "Retinoids",
        "benefits": (
            "Used in skincare formulations targeting acne "
            "and signs of skin aging."
        ),
        "concerns": [
            "Acne",
            "Fine Lines",
            "Fine Lines/Aging",
            "Wrinkles"
        ],
        "suitable_skin_types": [
            "oily",
            "combination",
            "normal"
        ],
        "caution": (
            "May cause irritation and dryness. "
            "Introduce gradually and follow appropriate guidance."
        ),
        "education": (
            "Retinoids are vitamin A derivatives commonly used "
            "in skincare for acne and signs of aging."
        ),
    },

    "AHA": {
        "category": "AHAs/BHAs",
        "benefits": (
            "Helps exfoliate the surface of the skin "
            "and improve the appearance of uneven texture."
        ),
        "concerns": [
            "Dullness",
            "Hyperpigmentation",
            "Dark Spots",
            "Uneven Skin Tone"
        ],
        "suitable_skin_types": [
            "normal",
            "dry",
            "combination"
        ],
        "caution": (
            "Can increase irritation or dryness if overused."
        ),
        "education": (
            "Alpha hydroxy acids are exfoliating ingredients "
            "commonly used to improve skin texture and appearance."
        ),
    },
}


# ---------------------------------------------------------
# INGREDIENT INTERACTIONS
# ---------------------------------------------------------

INGREDIENT_INTERACTIONS = {

    frozenset(["Retinoids", "AHA"]): (
        "Using retinoids and AHAs together may increase "
        "the chance of irritation and dryness. Consider "
        "using them at different times."
    ),

    frozenset(["Retinoids", "Salicylic Acid"]): (
        "Using retinoids and salicylic acid together may "
        "increase dryness or irritation. Introduce carefully."
    ),

    frozenset(["AHA", "Salicylic Acid"]): (
        "Using multiple exfoliating acids together may "
        "increase irritation. Avoid excessive exfoliation."
    ),

    frozenset(["Vitamin C", "Retinoids"]): (
        "These active ingredients may be irritating when "
        "combined for some users. Consider separating use."
    ),
}


# ---------------------------------------------------------
# NORMALIZE TEXT
# ---------------------------------------------------------

def normalize_text(value):

    if value is None:
        return ""

    return str(value).strip().lower()


# ---------------------------------------------------------
# NORMALIZE CONCERN
# ---------------------------------------------------------

def concern_matches(
    primary_concern,
    ingredient_concerns
):

    primary = normalize_text(primary_concern)

    for concern in ingredient_concerns:

        if primary == normalize_text(concern):
            return True

    return False


# ---------------------------------------------------------
# CHECK ALLERGY
# ---------------------------------------------------------

def ingredient_matches_allergy(
    ingredient_name,
    allergies
):

    if not allergies:
        return False

    ingredient_name = normalize_text(
        ingredient_name
    )

    allergy_text = normalize_text(
        allergies
    )

    return ingredient_name in allergy_text


# ---------------------------------------------------------
# CHECK INGREDIENT SUITABILITY
# ---------------------------------------------------------

def check_ingredient_suitability(
    ingredient_name,
    skin_type,
    sensitivity,
    allergies
):

    ingredient = INGREDIENTS.get(
        ingredient_name
    )

    if not ingredient:

        return {
            "suitable": False,
            "reason": "Ingredient information not available."
        }

    # Allergy check

    if ingredient_matches_allergy(
        ingredient_name,
        allergies
    ):

        return {
            "suitable": False,
            "reason": (
                "Ingredient matches a reported allergy."
            )
        }

    # Skin type check

    normalized_skin_type = normalize_text(
        skin_type
    )

    suitable_skin_types = [
        normalize_text(item)
        for item in ingredient[
            "suitable_skin_types"
        ]
    ]

    if (
        normalized_skin_type
        and normalized_skin_type
        not in suitable_skin_types
    ):

        return {
            "suitable": False,
            "reason": (
                "Ingredient may not be the best "
                "match for this skin type."
            )
        }

    # Sensitivity check

    normalized_sensitivity = normalize_text(
        sensitivity
    )

    if (
        normalized_sensitivity == "high"
        and ingredient_name in [
            "Salicylic Acid",
            "Vitamin C",
            "Retinoids",
            "AHA"
        ]
    ):

        return {
            "suitable": True,
            "reason": (
                "Potentially useful, but high sensitivity "
                "requires extra caution and gradual use."
            )
        }

    return {
        "suitable": True,
        "reason": ingredient["caution"]
    }


# ---------------------------------------------------------
# GET RECOMMENDED INGREDIENTS
# ---------------------------------------------------------

def get_recommended_ingredients(
    primary_concern,
    skin_type,
    sensitivity=None,
    allergies=None
):

    recommendations = []

    if not primary_concern:
        return recommendations

    for ingredient_name, data in INGREDIENTS.items():

        if not concern_matches(
            primary_concern,
            data["concerns"]
        ):
            continue

        suitability = check_ingredient_suitability(
            ingredient_name=ingredient_name,
            skin_type=skin_type,
            sensitivity=sensitivity,
            allergies=allergies,
        )

        if not suitability["suitable"]:
            continue

        recommendations.append({

            "ingredient": ingredient_name,

            "category": data["category"],

            "benefits": data["benefits"],

            "reason": suitability["reason"],

            "education": data["education"],

        })

    return recommendations


# ---------------------------------------------------------
# INGREDIENT INTERACTION ANALYSIS
# ---------------------------------------------------------

def analyze_ingredient_interactions(
    ingredient_names
):

    interactions = []

    if not ingredient_names:
        return interactions

    normalized_names = {
        normalize_text(name): name
        for name in ingredient_names
    }

    categories = set()

    for name in ingredient_names:

        for ingredient_name, data in INGREDIENTS.items():

            if normalize_text(ingredient_name) == normalize_text(name):

                categories.add(
                    ingredient_name
                )

    category_pairs = []

    for first in categories:

        for second in categories:

            if first >= second:
                continue

            pair = frozenset([
                first,
                second
            ])

            if pair in INGREDIENT_INTERACTIONS:

                category_pairs.append(pair)

    for pair in category_pairs:

        interactions.append({

            "ingredients": list(pair),

            "warning": INGREDIENT_INTERACTIONS[pair],

        })

    return interactions


# ---------------------------------------------------------
# INGREDIENT EDUCATION
# ---------------------------------------------------------

def get_ingredient_education(
    ingredient_name
):

    ingredient = INGREDIENTS.get(
        ingredient_name
    )

    if not ingredient:

        return {
            "ingredient": ingredient_name,
            "message": (
                "Ingredient information not available."
            )
        }

    return {

        "ingredient": ingredient_name,

        "category": ingredient["category"],

        "benefits": ingredient["benefits"],

        "education": ingredient["education"],

        "caution": ingredient["caution"],

    }


# ---------------------------------------------------------
# MAIN INGREDIENT ANALYSIS
# ---------------------------------------------------------

def analyze_ingredients(
    primary_concern,
    skin_type,
    sensitivity=None,
    allergies=None
):

    recommended = get_recommended_ingredients(

        primary_concern=primary_concern,

        skin_type=skin_type,

        sensitivity=sensitivity,

        allergies=allergies,

    )

    return {

        "primary_concern": primary_concern,

        "recommended_ingredients": recommended,

        "total_recommended": len(
            recommended
        ),

    }