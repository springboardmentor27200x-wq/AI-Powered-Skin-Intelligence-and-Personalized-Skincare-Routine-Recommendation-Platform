import pytest
from datetime import date


def test_hydration_records_crud(client, auth_headers):
    today = str(date.today())
    
    # Log 1st hydration entry
    log1 = client.post(
        "/api/hydration",
        headers=auth_headers,
        json={
            "water_intake_ml": 500,
            "record_date": today
        }
    )
    assert log1.status_code == 201
    entry1_id = log1.json()["id"]

    # Log 2nd hydration entry
    log2 = client.post(
        "/api/hydration",
        headers=auth_headers,
        json={
            "water_intake_ml": 750,
            "record_date": today
        }
    )
    assert log2.status_code == 201

    # Get hydration summary and daily total
    summary_res = client.get("/api/hydration", headers=auth_headers)
    assert summary_res.status_code == 200
    summary = summary_res.json()
    assert summary["today_total_ml"] == 1250
    assert summary["total_records"] == 2

    # Update 1st hydration entry
    update_res = client.put(
        f"/api/hydration/{entry1_id}",
        headers=auth_headers,
        json={
            "water_intake_ml": 1000,
            "record_date": today
        }
    )
    assert update_res.status_code == 200
    assert update_res.json()["water_intake_ml"] == 1000

    # Delete 1st entry
    del_res = client.delete(f"/api/hydration/{entry1_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Check updated total
    summary_after = client.get("/api/hydration", headers=auth_headers)
    assert summary_after.json()["today_total_ml"] == 750
