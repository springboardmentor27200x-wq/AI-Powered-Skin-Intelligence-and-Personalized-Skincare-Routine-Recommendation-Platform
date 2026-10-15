def test_ingredient_analysis_and_product_recommendations(client, auth_headers):
    ingredient_response = client.post(
        "/api/recommendations/ingredient-analysis",
        headers=auth_headers,
        json={
            "skin_type": "oily",
            "concerns": ["acne", "redness"],
            "allergies": ["fragrance"],
            "ingredients": ["niacinamide", "salicylic acid", "retinol", "fragrance", "hyaluronic acid"],
        },
    )

    assert ingredient_response.status_code == 200
    ingredient_data = ingredient_response.json()
    assert 0 <= ingredient_data["score"] <= 100
    assert ingredient_data["safe_ingredients"]
    assert ingredient_data["avoid_ingredients"]
    assert ingredient_data["interactions"]

    product_response = client.post(
        "/api/recommendations/products",
        headers=auth_headers,
        json={
            "skin_type": "oily",
            "concerns": ["acne", "redness"],
            "allergies": ["fragrance"],
            "budget": 75,
        },
    )

    assert product_response.status_code == 200
    product_data = product_response.json()
    assert product_data["recommendations"]
    assert product_data["recommendations"][0]["name"]


def test_products_exclude_allergens_and_respect_budget(client, auth_headers):
    response = client.post(
        "/api/recommendations/products",
        headers=auth_headers,
        json={
            "skin_type": "oily",
            "concerns": ["acne"],
            "allergies": ["niacinamide"],
            "budget": 40,
        },
    )

    assert response.status_code == 200
    products = response.json()["recommendations"]
    assert products
    assert all(product["price"] <= 40 for product in products)
    assert all(product["name"] == "HydraLock Ceramide Cream" for product in products)


def test_ingredient_analysis_flags_active_conflicts(client, auth_headers):
    response = client.post(
        "/api/recommendations/ingredient-analysis",
        headers=auth_headers,
        json={
            "skin_type": "combination",
            "ingredients": ["retinol", "glycolic acid"],
        },
    )

    assert response.status_code == 200
    interactions = response.json()["interactions"]
    assert len(interactions) == 1
    assert set(interactions[0]["ingredients"]) == {"retinol", "glycolic acid"}
    assert interactions[0]["severity"] == "moderate"
