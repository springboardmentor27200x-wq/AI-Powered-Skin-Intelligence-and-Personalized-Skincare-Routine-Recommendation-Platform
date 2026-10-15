import pytest
from datetime import date


def test_sleep_records_crud(client, auth_headers):
    # Log a sleep record
    today = str(date.today())
    log_res = client.post(
        "/api/sleep",
        headers=auth_headers,
        json={
            "sleep_duration_hours": 7.5,
            "sleep_quality": "Good",
            "bedtime": "23:00",
            "wake_time": "06:30",
            "sleep_consistency": "Consistent",
            "record_date": today
        }
    )
    assert log_res.status_code == 201
    record = log_res.json()
    assert record["sleep_duration_hours"] == 7.5
    assert record["sleep_quality"] == "Good"
    record_id = record["id"]

    # Get sleep history
    history_res = client.get("/api/sleep", headers=auth_headers)
    assert history_res.status_code == 200
    data = history_res.json()
    assert data["total_records"] == 1
    assert data["average_duration"] == 7.5
    assert len(data["records"]) == 1

    # Update sleep record
    update_res = client.put(
        f"/api/sleep/{record_id}",
        headers=auth_headers,
        json={
            "sleep_duration_hours": 8.0,
            "sleep_quality": "Excellent"
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["sleep_duration_hours"] == 8.0
    assert update_res.json()["sleep_quality"] == "Excellent"

    # Delete sleep record
    del_res = client.delete(f"/api/sleep/{record_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify history is empty
    history_after = client.get("/api/sleep", headers=auth_headers)
    assert history_after.json()["total_records"] == 0
