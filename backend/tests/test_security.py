from app.core.security import (
    hash_password, verify_password, create_access_token, decode_access_token,
)


def test_hash_password_does_not_store_plaintext():
    hashed = hash_password("MyPassword123")
    assert hashed != "MyPassword123"
    assert hashed.startswith("$2b$")  # bcrypt hash prefix


def test_verify_password_correct():
    hashed = hash_password("MyPassword123")
    assert verify_password("MyPassword123", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("MyPassword123")
    assert verify_password("WrongPassword", hashed) is False


def test_access_token_round_trip():
    token = create_access_token(subject="user-123", role="user")
    payload = decode_access_token(token)
    assert payload is not None
    assert payload["sub"] == "user-123"
    assert payload["role"] == "user"


def test_decode_invalid_token_returns_none():
    assert decode_access_token("not-a-real-token") is None