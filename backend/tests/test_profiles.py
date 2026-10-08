def test_create_skin_profile(client, user_auth_headers):
    profile_payload = {
        "age": 25,
        "age_group": "25-34",
        "skin_type": "OILY",
        "oil_characteristics": "High sebum in T-Zone and enlarged pores",
        "concerns": ["Acne", "Hyperpigmentation"],
        "allergies": ["Fragrance"],
        "sensitivities": ["High strength Retinol"],
        "skin_goals": ["Clear Acne", "Even Tone"],
        "working_routine": "Desk/Screen work indoors",
        "exercise_frequency": "Daily",
        "exercise_duration_mins": 45,
        "stress_level": 4,
        "baseline_water_intake_ml": 2500,
        "baseline_sleep_hours": 8,
        "sun_exposure_level": "Moderate (1-3 hours)",
        "climate_type": "Temperate",
        "notes": "Skin gets oily around midday."
    }
    response = client.post("/api/v1/profiles/me", json=profile_payload, headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["age"] == 25
    assert data["skin_type"] == "OILY"
    assert data["oil_characteristics"] == "High sebum in T-Zone and enlarged pores"
    assert "Acne" in data["concerns"]
    assert "Fragrance" in data["allergies"]
    assert data["exercise_frequency"] == "Daily"

def test_get_skin_profile_me(client, user_auth_headers):
    profile_payload = {
        "age": 32,
        "age_group": "25-34",
        "skin_type": "DRY",
        "oil_characteristics": "Minimal sebum, dry and flaky patches",
        "concerns": ["Fine Lines", "Dry Skin"],
        "allergies": [],
        "sensitivities": [],
        "skin_goals": ["Deep Hydration"],
        "working_routine": "Mixed indoors & outdoors",
        "exercise_frequency": "1-2 times a week",
        "exercise_duration_mins": 30,
        "stress_level": 6,
        "baseline_water_intake_ml": 2000,
        "baseline_sleep_hours": 7,
        "sun_exposure_level": "Low",
        "climate_type": "Cold & Dry",
        "notes": "Flaky patches on forehead."
    }
    client.post("/api/v1/profiles/me", json=profile_payload, headers=user_auth_headers)
    
    get_res = client.get("/api/v1/profiles/me", headers=user_auth_headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["age"] == 32
    assert data["skin_type"] == "DRY"
    assert "Fine Lines" in data["concerns"]

def test_update_skin_profile_partial(client, user_auth_headers):
    initial_payload = {
        "age": 22,
        "age_group": "18-24",
        "skin_type": "OILY",
        "oil_characteristics": "Excess sebum",
        "concerns": ["Acne"],
        "allergies": [],
        "sensitivities": [],
        "skin_goals": ["Oil Control"],
        "working_routine": "Student",
        "exercise_frequency": "3-4 times a week",
        "exercise_duration_mins": 30,
        "stress_level": 5,
        "baseline_water_intake_ml": 2000,
        "baseline_sleep_hours": 7,
        "sun_exposure_level": "Moderate",
        "climate_type": "Hot & Humid"
    }
    client.post("/api/v1/profiles/me", json=initial_payload, headers=user_auth_headers)

    patch_payload = {
        "age": 23,
        "concerns": ["Acne", "Redness"],
        "baseline_water_intake_ml": 3000
    }
    patch_res = client.patch("/api/v1/profiles/me", json=patch_payload, headers=user_auth_headers)
    assert patch_res.status_code == 200
    data = patch_res.json()
    assert data["age"] == 23
    assert data["concerns"] == ["Acne", "Redness"]
    assert data["baseline_water_intake_ml"] == 3000
    assert data["skin_type"] == "OILY"
