def test_user_registration(client):
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecretPassword123!",
            "full_name": "Jane Doe",
            "role": "USER"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "Jane Doe"
    assert data["role"] == "USER"
    assert "id" in data

def test_duplicate_registration_fails(client, test_user):
    user_email = test_user["email"] if isinstance(test_user, dict) else test_user.email
    response = client.post(
        "/api/v1/auth/register",
        json={
            "email": user_email,
            "password": "AnotherPassword123!",
            "full_name": "Duplicate User",
            "role": "USER"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]

def test_login_success(client, test_user):
    user_email = test_user["email"] if isinstance(test_user, dict) else test_user.email
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_email,
            "password": "Password123!"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["role"] == "USER"
    assert data["email"] == user_email

def test_login_invalid_password(client, test_user):
    user_email = test_user["email"] if isinstance(test_user, dict) else test_user.email
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": user_email,
            "password": "WrongPassword!"
        }
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_get_current_user_me(client, user_auth_headers, test_user):
    user_id = test_user["id"] if isinstance(test_user, dict) else test_user.id
    user_email = test_user["email"] if isinstance(test_user, dict) else test_user.email
    response = client.get("/api/v1/auth/me", headers=user_auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["email"] == user_email
