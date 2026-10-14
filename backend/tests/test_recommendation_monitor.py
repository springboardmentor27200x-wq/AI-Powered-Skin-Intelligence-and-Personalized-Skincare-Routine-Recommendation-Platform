from types import SimpleNamespace

from app.services.recommendation_monitor import monitor_recommendations, RECOMMENDED_MIN_SCORE, TOP_N


def product(pid, name, category="Serum", skin_types=("oily",), brand="Brand"):
    return SimpleNamespace(id=pid, name=name, category=category, brand=brand, skin_types=list(skin_types))


def profile(uid, skin_type="oily", allergies=None, sensitivities=None):
    return SimpleNamespace(user_id=uid, skin_type=skin_type, allergies=allergies, sensitivities=sensitivities)


def ing(name, category=None):
    return SimpleNamespace(name=name, category=category or name)


def run(profiles, products, ingredients=None, concerns=None):
    return monitor_recommendations(
        profiles=profiles, products=products,
        ingredients_by_product=ingredients or {}, concerns_by_user=concerns or {},
    )


def by_name(entries, name):
    return next(e for e in entries if e["name"] == name)


# ---- empty cases ----

def test_no_profiles_returns_empty_summary():
    result = run([], [product(1, "A")])
    assert result["users_evaluated"] == 0
    assert result["total_pairs"] == 0
    assert result["average_score"] is None
    assert result["conflict_rate"] is None
    assert result["top_products"] == [] and result["most_flagged_products"] == []
    assert result["category_scores"] == []


def test_no_products_returns_empty_summary():
    result = run([profile(1)], [])
    assert result["products_evaluated"] == 0
    assert result["total_pairs"] == 0
    assert result["average_score"] is None


# ---- counting & scoring ----

def test_perfect_match_is_recommended_for_everyone():
    result = run([profile(1), profile(2)], [product(10, "Gel")])
    top = by_name(result["top_products"], "Gel")
    assert top["times_recommended"] == 2
    assert top["average_score"] == 100.0
    assert result["total_pairs"] == 2
    assert result["average_score"] == 100.0


def test_allergen_conflict_is_counted_and_blocks_recommendation():
    products = [product(10, "Salicylic Gel")]
    result = run(
        [profile(1, allergies=["Salicylic Acid"]), profile(2)],
        products, ingredients={10: [ing("Salicylic Acid")]},
    )
    assert result["allergen_conflict_pairs"] == 1
    assert result["conflict_rate"] == 50.0
    flagged = by_name(result["most_flagged_products"], "Salicylic Gel")
    assert flagged["allergen_conflicts"] == 1
    assert flagged["times_recommended"] == 1  # only the non-allergic user


def test_caution_flag_counted_when_no_allergen():
    result = run(
        [profile(1, skin_type="sensitive")],
        [product(10, "Retinol Serum", skin_types=("sensitive",))],
        ingredients={10: [ing("Retinol", "Retinoids")]},
    )
    flagged = by_name(result["most_flagged_products"], "Retinol Serum")
    assert flagged["caution_flags"] == 1
    assert flagged["allergen_conflicts"] == 0


def test_allergy_counts_as_allergen_not_also_caution():
    result = run(
        [profile(1, skin_type="sensitive", allergies=["Retinoids"])],
        [product(10, "Retinol Serum", skin_types=("sensitive",))],
        ingredients={10: [ing("Retinol", "Retinoids")]},
    )
    flagged = by_name(result["most_flagged_products"], "Retinol Serum")
    assert flagged["allergen_conflicts"] == 1
    assert flagged["caution_flags"] == 0


def test_threshold_boundary():
    # skin-type mismatch only -> 85 (recommended); mismatch + caution -> 75 (not)
    products = [product(10, "Mismatch", skin_types=("dry",)), product(11, "MismatchCaution", skin_types=("dry",))]
    result = run(
        [profile(1, skin_type="sensitive")], products,
        ingredients={11: [ing("Retinol", "Retinoids")]},
    )
    assert RECOMMENDED_MIN_SCORE == 80
    assert by_name(result["top_products"], "Mismatch")["average_score"] == 85.0
    assert all(p["name"] != "MismatchCaution" for p in result["top_products"])


def test_priority_concerns_raise_the_score():
    products = [product(10, "Acne Gel", skin_types=("dry",))]  # mismatch -15 -> 85
    ingredients = {10: [ing("Salicylic Acid")]}
    without = run([profile(1)], products, ingredients)
    with_concern = run([profile(1)], products, ingredients, concerns={1: ["acne"]})
    assert by_name(without["top_products"], "Acne Gel")["average_score"] == 85.0
    assert by_name(with_concern["top_products"], "Acne Gel")["average_score"] == 100.0


def test_missing_allergy_and_sensitivity_lists_are_handled():
    result = run([profile(1, allergies=None, sensitivities=None)], [product(10, "Gel")])
    assert result["users_evaluated"] == 1


# ---- ordering & limits ----

def test_top_products_ordered_by_recommendations_then_score_then_name():
    products = [
        product(1, "Beta"),                              # recommended for both users, 100
        product(2, "Alpha"),                             # recommended for both users, 100
        product(3, "Gamma", skin_types=("dry",)),        # 85 for both
    ]
    result = run([profile(1), profile(2)], products)
    assert [p["name"] for p in result["top_products"]] == ["Alpha", "Beta", "Gamma"]


def test_top_products_limited_to_top_n():
    products = [product(i, f"P{i}") for i in range(TOP_N + 3)]
    assert len(run([profile(1)], products)["top_products"]) == TOP_N


def test_most_flagged_puts_allergen_conflicts_first():
    products = [product(1, "CautionOnly", skin_types=("sensitive",)), product(2, "AllergenOne", skin_types=("sensitive",))]
    result = run(
        [profile(1, skin_type="sensitive", allergies=["Vitamin C"])],
        products,
        ingredients={1: [ing("Retinol", "Retinoids")], 2: [ing("Vitamin C")]},
    )
    assert [p["name"] for p in result["most_flagged_products"]] == ["AllergenOne", "CautionOnly"]


def test_unflagged_products_are_not_listed_as_flagged():
    assert run([profile(1)], [product(1, "Clean")])["most_flagged_products"] == []


# ---- categories ----

def test_category_scores_average_and_count_products():
    products = [
        product(1, "A", category="Serum"),
        product(2, "B", category="Serum", skin_types=("dry",)),   # 85
        product(3, "C", category="Toner"),                        # 100
    ]
    result = run([profile(1)], products)
    cats = {c["category"]: c for c in result["category_scores"]}
    assert cats["Serum"]["average_score"] == 92.5   # (100 + 85) / 2
    assert cats["Serum"]["products"] == 2
    assert cats["Toner"]["average_score"] == 100.0
    assert [c["category"] for c in result["category_scores"]] == ["Toner", "Serum"]  # best first