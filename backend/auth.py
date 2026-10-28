from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)


def create_access_token(data: dict):
    import jwt
    import os
    from datetime import datetime, timedelta, timezone

    secret_key = os.getenv("SECRET_KEY")
    algorithm = os.getenv("ALGORITHM", "HS256")
    expire_minutes = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expire_minutes
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        secret_key,
        algorithm=algorithm
    )
import secrets


def generate_verification_token():
    return secrets.token_urlsafe(32)