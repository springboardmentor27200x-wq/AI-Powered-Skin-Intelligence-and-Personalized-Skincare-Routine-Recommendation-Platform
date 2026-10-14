from types import SimpleNamespace

from app.services.ingredient_engine import assess_ingredient_suitability


def ingredient(name, category):
    return SimpleNamespace(name=name, category=category)


def test_suitable_when_no_conflicts():
    status, reasons = assess_ingredient_suitability(
        ingredient("Hyaluronic Acid", "Hyaluronic Acid"), allergies=[], sensitivities=[], skin_type="oily"
    )
    assert status == "suitable"
    assert any("no known conflicts" in r.lower() for r in reasons)


def test_allergy_match_is_avoid():
    status, reasons = assess_ingredient_suitability(
        ingredient("Salicylic Acid", "Salicylic Acid"),
        allergies=["Salicylic Acid"], sensitivities=[], skin_type="oily",
    )
    assert status == "avoid"
    assert any("allerg" in r.lower() for r in reasons)


def test_sensitivity_match_is_caution_not_avoid():
    status, reasons = assess_ingredient_suitability(
        ingredient("Vitamin C", "Vitamin C"),
        allergies=[], sensitivities=["Vitamin C"], skin_type="oily",
    )
    assert status == "caution"
    assert any("sensitiv" in r.lower() for r in reasons)


def test_skin_type_caution_for_retinoids_on_sensitive_skin():
    status, reasons = assess_ingredient_suitability(
        ingredient("Retinol", "Retinoids"), allergies=[], sensitivities=[], skin_type="sensitive",
    )
    assert status == "caution"
    assert any("irritate sensitive skin" in r for r in reasons)


def test_allergy_takes_priority_over_skin_type_caution():
    status, reasons = assess_ingredient_suitability(
        ingredient("Retinol", "Retinoids"), allergies=["Retinoids"], sensitivities=[], skin_type="sensitive",
    )
    assert status == "avoid"
    assert any("retinoid" in r.lower() for r in reasons)


def test_category_level_allergy_match():
    status, reasons = assess_ingredient_suitability(
        ingredient("Glycolic Acid", "AHAs/BHAs"), allergies=["AHAs/BHAs"], sensitivities=[], skin_type="normal",
    )
    assert status == "avoid"


def test_no_caution_for_unlisted_category_skin_type_combo():
    status, reasons = assess_ingredient_suitability(
        ingredient("Niacinamide", "Niacinamide"), allergies=[], sensitivities=[], skin_type="sensitive",
    )
    assert status == "suitable"