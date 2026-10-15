import pytest


def test_lifestyle_profile_lifecycle(client, auth_headers):
    # Initially 404
    get_res = client.get("/api/lifestyle", headers=auth_headers)
    assert get_res.status_code == 404

    # Create lifestyle profile
    create_res = client.post(
        "/api/lifestyle",
        headers=auth_headers,
        json={
            "physical_activity": "Moderate",
            "smoking": "Never",
            "alcohol_consumption": "Occasionally",
            "screen_time_hours": 6.5,
            "outdoor_exposure": "Moderate (1-3 hours)",
            "pollution_exposure": "Low",
            "sun_exposure": "Moderate",
            "environment_type": "Indoor"
        }
    )
    assert create_res.status_code == 201
    lifestyle = create_res.json()
    assert lifestyle["physical_activity"] == "Moderate"
    assert lifestyle["screen_time_hours"] == 6.5

    # Get lifestyle profile
    get_res = client.get("/api/lifestyle", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["smoking"] == "Never"

    # Update lifestyle profile
    update_res = client.put(
        "/api/lifestyle",
        headers=auth_headers,
        json={
            "screen_time_hours": 8.0,
            "physical_activity": "High"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["screen_time_hours"] == 8.0
    assert update_res.json()["physical_activity"] == "High"
