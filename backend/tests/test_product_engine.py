from app.services.product_engine import score_product


def test_skin_type_match_no_penalty():
    score, reasons = score_product(
        skin_types=["oily", "combination"], ingredient_names_and_categories=[],
        ingredient_statuses={}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 100
    assert any("formulated for oily skin" in r.lower() for r in reasons)


def test_skin_type_mismatch_penalty():
    score, reasons = score_product(
        skin_types=["dry"], ingredient_names_and_categories=[],
        ingredient_statuses={}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 85
    assert any("not typically formulated" in r.lower() for r in reasons)


def test_no_skin_types_listed_no_penalty():
    score, reasons = score_product(
        skin_types=[], ingredient_names_and_categories=[],
        ingredient_statuses={}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 100


def test_allergen_ingredient_heavy_penalty():
    score, reasons = score_product(
        skin_types=["oily"], ingredient_names_and_categories=[("Retinol", "Retinoids")],
        ingredient_statuses={"Retinol": "avoid"}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 60
    assert any("conflicts with your allergies" in r.lower() for r in reasons)


def test_caution_ingredient_moderate_penalty():
    score, reasons = score_product(
        skin_types=["oily"], ingredient_names_and_categories=[("Retinol", "Retinoids")],
        ingredient_statuses={"Retinol": "caution"}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 90
    assert any("use with caution" in r.lower() for r in reasons)


def test_priority_concern_match_bonus():
    score, reasons = score_product(
        skin_types=["oily"], ingredient_names_and_categories=[("Salicylic Acid", "Salicylic Acid")],
        ingredient_statuses={"Salicylic Acid": "suitable"}, user_skin_type="oily",
        prioritized_concerns=["acne"],
    )
    assert score == 100
    assert any("priority concern" in r.lower() for r in reasons)


def test_score_clamps_at_zero_with_multiple_allergens():
    score, reasons = score_product(
        skin_types=["dry"],
        ingredient_names_and_categories=[("A", "X"), ("B", "Y"), ("C", "Z")],
        ingredient_statuses={"A": "avoid", "B": "avoid", "C": "avoid"},
        user_skin_type="oily", prioritized_concerns=[],
    )
    assert score == 0


def test_no_reasons_falls_back_to_default_message():
    score, reasons = score_product(
        skin_types=[], ingredient_names_and_categories=[],
        ingredient_statuses={}, user_skin_type="oily", prioritized_concerns=[],
    )
    assert reasons == ["No specific concerns or benefits identified for your profile."]


def test_concern_normalization_handles_underscores_and_case():
    score, reasons = score_product(
        skin_types=["oily"], ingredient_names_and_categories=[("Niacinamide", "Niacinamide")],
        ingredient_statuses={"Niacinamide": "suitable"}, user_skin_type="oily",
        prioritized_concerns=["Oily_Skin"],
    )
    assert score == 100
    assert any("priority concern" in r.lower() for r in reasons)