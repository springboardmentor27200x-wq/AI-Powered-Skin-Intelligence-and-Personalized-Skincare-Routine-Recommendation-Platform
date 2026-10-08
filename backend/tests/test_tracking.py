def test_lifestyle_logging(client, user_auth_headers):
    payload = {
        "working_routine": "Desk/Screen work indoors",
        "exercise_frequency": "3-4 times a week",
        "exercise_minutes": 45,
        "stress_level": 3,
        "diet_quality_score": 9,
        "alcohol_units": 0,
        "smoking_status": "Non-smoker",
        "notes": "Healthy diet with greens and antioxidants."
    }
    res = client.post("/api/v1/tracking/lifestyle", json=payload, headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["working_routine"] == "Desk/Screen work indoors"
    assert data["exercise_frequency"] == "3-4 times a week"
    assert data["exercise_minutes"] == 45
    assert data["stress_level"] == 3

def test_sleep_logging(client, user_auth_headers):
    payload = {
        "sleep_duration_hours": 8.0,
        "sleep_quality": "EXCELLENT",
        "wake_feeling": "Good & Refreshed",
        "deep_sleep_hours": 2.5,
        "bedtime": "22:30",
        "wake_time": "06:30",
        "notes": "Felt completely refreshed upon waking."
    }
    res = client.post("/api/v1/tracking/sleep", json=payload, headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["sleep_duration_hours"] == 8.0
    assert data["sleep_quality"] == "EXCELLENT"
    assert data["wake_feeling"] == "Good & Refreshed"

def test_environment_logging(client, user_auth_headers):
    payload = {
        "sun_exposure_hours": 2.5,
        "uv_index": 5.0,
        "dust_pollution_exposure": "High",
        "weather_condition": "Cold & Dry",
        "pollution_aqi": 60,
        "humidity_percent": 45.0
    }
    res = client.post("/api/v1/tracking/environment", json=payload, headers=user_auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["sun_exposure_hours"] == 2.5
    assert data["uv_index"] == 5.0
    assert data["dust_pollution_exposure"] == "High"
    assert data["weather_condition"] == "Cold & Dry"

def test_hydration_and_summary_calculation(client, user_auth_headers):
    # Log water intake
    hyd_payload = {
        "water_amount_ml": 500,
        "target_ml": 2500
    }
    h_res = client.post("/api/v1/tracking/hydration", json=hyd_payload, headers=user_auth_headers)
    assert h_res.status_code == 200
    assert h_res.json()["water_amount_ml"] == 500

    # Add more water
    h_res2 = client.post("/api/v1/tracking/hydration", json={"water_amount_ml": 500, "target_ml": 2500}, headers=user_auth_headers)
    assert h_res2.status_code == 200
    assert h_res2.json()["water_amount_ml"] == 1000

    # Fetch daily summary
    summary_res = client.get("/api/v1/tracking/summary", headers=user_auth_headers)
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert sum_data["hydration_total_ml"] == 1000
    assert sum_data["hydration_percentage"] == 40.0
    assert "lifestyle_impact_score" in sum_data
    assert 0 <= sum_data["lifestyle_impact_score"] <= 100
