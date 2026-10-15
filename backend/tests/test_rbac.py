import pytest


def test_admin_can_access_admin_users(client, admin_headers, test_user, admin_user):
    response = client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    data = response.json()
    assert "users" in data
    assert data["total"] >= 2


def test_standard_user_cannot_access_admin_users(client, auth_headers):
    response = client.get("/api/admin/users", headers=auth_headers)
    assert response.status_code == 403
    assert "Access denied" in response.json()["detail"]


def test_unauthenticated_cannot_access_admin_users(client):
    response = client.get("/api/admin/users")
    assert response.status_code == 401
