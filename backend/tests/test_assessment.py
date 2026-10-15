def test_assessment_generates_routine_and_priority_concerns(client, auth_headers):
    response = client.post(
        "/api/assessment/",
        headers=auth_headers,
        json={
            "age": 27,
            "skin_type": "oily",
            "concerns": ["acne", "redness"],
            "allergies": ["fragrance"],
            "budget": 75,
            "sleep_quality": "fair",
            "hydration_level": "moderate",
            "lifestyle_score": 65,
        },
    )

    assert response.status_code == 200
    body = response.json()

    assert 0 <= body["score"] <= 100
    assert "breakdown" in body
    assert "priority_concerns" in body
    assert body["priority_concerns"]
    assert "recommendations" in body and body["recommendations"]
    assert "routine" in body
    assert "morning" in body["routine"]
    assert "evening" in body["routine"]
