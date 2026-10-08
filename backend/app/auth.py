import os
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt


# =========================
# Password hashing
# =========================
# NOTE: switched from passlib's CryptContext to the bcrypt library
# directly. passlib 1.7.4 (in requirements.txt) is incompatible with
# bcrypt>=4.1 (also in requirements.txt) -- passlib reads an
# attribute bcrypt no longer exposes, which makes every hash/verify
# call crash with "password cannot be longer than 72 bytes" even for
# short passwords. bcrypt's own API sidesteps passlib entirely.

def hash_password(password: str) -> str:
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# =========================
# JWT (new -- for Module 1: JWT Authentication)
# =========================

# In production this should come only from the environment (.env).
# A default is provided so the app still runs for local development,
# but it should always be overridden via SECRET_KEY in .env.
# Configure a stable SECRET_KEY in .env for persistent sessions. The random
# fallback lets the API start without embedding a signing secret in source.
SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_urlsafe(48)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Encodes a JWT that carries the user's id, email and role.
    The role is what role-based access control checks against on
    every protected request -- no extra database lookup needed.
    """
    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """
    Raises jose.JWTError if the token is invalid, tampered with,
    or expired. Callers (see dependencies.py) turn that into a 401.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
