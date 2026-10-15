def test_generate_and_track_daily_routine(client, auth_headers):
    response = client.post(
        "/api/routines/generate",
        headers=auth_headers,
        json={
            "age": 31,
            "skin_type": "oily",
            "concerns": ["acne"],
            "allergies": ["fragrance"],
            "sleep_quality": "good",
            "hydration_level": "moderate",
        },
    )

    assert response.status_code == 200
    routine = response.json()
    assert routine["assessment_score"] > 0
    assert routine["routine"]["morning"]
    assert routine["today_completed_steps"] == 0
    assert routine["today_total_steps"] == len(routine["routine"]["morning"]) + len(routine["routine"]["evening"])
    assert all(day["total_steps"] == 0 for day in routine["recent_progress"][:-1])

    step_response = client.put(
        f"/api/routines/{routine['id']}/steps/morning:0",
        headers=auth_headers,
        json={"completed": True},
    )
    assert step_response.status_code == 200
    assert "morning:0" in step_response.json()["completed_step_keys"]
    assert step_response.json()["today_completed_steps"] == 1
    assert len(step_response.json()["recent_progress"]) == 7

    unset_response = client.put(
        f"/api/routines/{routine['id']}/steps/morning:0",
        headers=auth_headers,
        json={"completed": False},
    )
    assert unset_response.status_code == 200
    assert unset_response.json()["today_completed_steps"] == 0


def test_routine_steps_are_owned_and_validated(client, auth_headers):
    response = client.put(
        "/api/routines/999/steps/morning:0",
        headers=auth_headers,
        json={"completed": True},
    )
    assert response.status_code == 404

    invalid_step = client.put(
        "/api/routines/999/steps/not-a-step",
        headers=auth_headers,
        json={"completed": True},
    )
    assert invalid_step.status_code == 404