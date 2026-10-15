import pytest


def test_skin_profile_lifecycle(client, auth_headers):
    # Initially profile should be 404
    get_res = client.get("/api/skin-profile", headers=auth_headers)
    assert get_res.status_code == 404

    # Create skin profile
    create_res = client.post(
        "/api/skin-profile",
        headers=auth_headers,
        json={
            "skin_type": "Oily",
            "age_group": "25-34",
            "skin_concerns": ["Acne", "Redness"],
            "allergies": "Peanuts, Benzoyl Peroxide",
            "sensitivities": "Alcohol based toners"
        }
    )
    assert create_res.status_code == 201
    profile = create_res.json()
    assert profile["skin_type"] == "Oily"
    assert profile["age_group"] == "25-34"
    assert "Acne" in profile["skin_concerns"]
    assert profile["allergies"] == "Peanuts, Benzoyl Peroxide"

    # Get skin profile
    get_res = client.get("/api/skin-profile", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["skin_type"] == "Oily"

    # Update skin profile
    update_res = client.put(
        "/api/skin-profile",
        headers=auth_headers,
        json={
            "skin_type": "Combination",
            "skin_concerns": ["Acne", "Hyperpigmentation"]
        }
    )
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["skin_type"] == "Combination"
    assert "Hyperpigmentation" in updated["skin_concerns"]
