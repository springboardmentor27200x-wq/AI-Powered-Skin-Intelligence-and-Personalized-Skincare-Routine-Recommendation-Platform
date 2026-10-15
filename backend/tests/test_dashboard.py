import pytest
from datetime import date


def test_dashboard_summary(client, auth_headers):
    # 1. Empty profile should have completion 0%
    dash1 = client.get("/api/dashboard/summary", headers=auth_headers).json()
    assert dash1["completion"]["completion_percentage"] == 0
    assert dash1["skin_profile"] is None
    assert dash1["lifestyle"] is None

    # 2. Add skin profile -> completion +40%
    client.post(
        "/api/skin-profile",
        headers=auth_headers,
        json={
            "skin_type": "Dry",
            "age_group": "18-24",
            "skin_concerns": ["Dry Skin", "Flakiness"],
            "allergies": "None",
            "sensitivities": "None"
        }
    )
    dash2 = client.get("/api/dashboard/summary", headers=auth_headers).json()
    assert dash2["completion"]["completion_percentage"] == 40
    assert dash2["skin_profile"]["skin_type"] == "Dry"

    # 3. Add lifestyle profile -> completion +30% = 70%
    client.post(
        "/api/lifestyle",
        headers=auth_headers,
        json={
            "physical_activity": "Light",
            "smoking": "Never",
            "alcohol_consumption": "None",
            "screen_time_hours": 5.0,
            "outdoor_exposure": "Low (<1 hour)"
        }
    )
    dash3 = client.get("/api/dashboard/summary", headers=auth_headers).json()
    assert dash3["completion"]["completion_percentage"] == 70

    # 4. Add sleep record -> +15% = 85%
    client.post(
        "/api/sleep",
        headers=auth_headers,
        json={
            "sleep_duration_hours": 8.0,
            "sleep_quality": "Excellent",
            "record_date": str(date.today())
        }
    )
    dash4 = client.get("/api/dashboard/summary", headers=auth_headers).json()
    assert dash4["completion"]["completion_percentage"] == 85

    # 5. Add hydration record -> +15% = 100%
    client.post(
        "/api/hydration",
        headers=auth_headers,
        json={
            "water_intake_ml": 1200,
            "record_date": str(date.today())
        }
    )
    dash5 = client.get("/api/dashboard/summary", headers=auth_headers).json()
    assert dash5["completion"]["completion_percentage"] == 100
    assert dash5["today_hydration_ml"] == 1200


def test_dashboard_progress_analytics(client, auth_headers):
    client.post(
        "/api/skin-profile",
        headers=auth_headers,
        json={
            "skin_type": "Dry",
            "age_group": "18-24",
            "skin_concerns": ["Dry Skin", "Flakiness"],
            "allergies": "None",
            "sensitivities": "None",
        },
    )
    client.post(
        "/api/lifestyle",
        headers=auth_headers,
        json={
            "physical_activity": "Moderate",
            "smoking": "Never",
            "alcohol_consumption": "Occasionally",
            "screen_time_hours": 4.5,
            "outdoor_exposure": "Moderate (1-3 hours)",
        },
    )
    client.post(
        "/api/sleep",
        headers=auth_headers,
        json={
            "sleep_duration_hours": 7.5,
            "sleep_quality": "Good",
            "record_date": str(date.today()),
        },
    )
    client.post(
        "/api/hydration",
        headers=auth_headers,
        json={
            "water_intake_ml": 1800,
            "record_date": str(date.today()),
        },
    )

    response = client.get("/api/dashboard/progress", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert 0 <= body["overall_skin_health_score"] <= 100
    assert body["trend"] == []
    assert body["alerts"]
    assert body["summary"]


def test_dashboard_progress_uses_saved_assessment_history(client, auth_headers):
    scores = []
    for skin_type, concerns in [("oily", ["acne"]), ("dry", ["flakiness"])]:
        response = client.post(
            "/api/routines/generate",
            headers=auth_headers,
            json={"age": 31, "skin_type": skin_type, "concerns": concerns},
        )
        assert response.status_code == 200
        scores.append(response.json()["assessment_score"])

    analytics = client.get("/api/dashboard/progress", headers=auth_headers)
    assert analytics.status_code == 200
    assert [point["score"] for point in analytics.json()["trend"]] == scores
