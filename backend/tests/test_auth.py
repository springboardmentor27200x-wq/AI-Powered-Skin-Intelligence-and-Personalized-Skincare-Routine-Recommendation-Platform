import pytest


def test_register_user_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Jane Doe",
            "email": "jane@example.com",
            "password": "SecurePassword123!",
            "confirm_password": "SecurePassword123!",
            "role": "USER"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jane@example.com"
    assert data["full_name"] == "Jane Doe"
    assert data["role"] == "USER"
    assert data["is_active"] is True
    assert "id" in data


def test_register_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Duplicate User",
            "email": test_user.email,
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "USER"
        }
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]


def test_register_password_mismatch(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Mismatch User",
            "email": "mismatch@example.com",
            "password": "Password123!",
            "confirm_password": "WrongPassword123!",
            "role": "USER"
        }
    )
    assert response.status_code == 422


def test_register_as_admin_forbidden(client):
    response = client.post(
        "/api/auth/register",
        json={
            "full_name": "Wannabe Admin",
            "email": "hacker@example.com",
            "password": "Password123!",
            "confirm_password": "Password123!",
            "role": "ADMINISTRATOR"
        }
    )
    assert response.status_code == 422 or response.status_code == 403


def test_login_success(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_user.email


def test_login_invalid_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={
            "email": test_user.email,
            "password": "IncorrectPassword!"
        }
    )
    assert response.status_code == 401


def test_get_current_user_me(client, auth_headers, test_user):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_get_me_unauthorized(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401
