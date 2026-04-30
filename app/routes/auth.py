from fastapi import APIRouter

from app.db import models
from app.db.database import SessionLocal
from app.schemas.schemas import LoginRequest
from app.services.admin_service import ensure_user_status_column


router = APIRouter(prefix="/auth", tags=["Auth"])


DEMO_LOGIN_ALIASES = {
    "admin": "admin@example.com",
    "student": "maya@example.com",
}

DEMO_PASSWORDS = {
    "admin@example.com": "admin123",
    "maya@example.com": "student123",
}


def normalize_login_identifier(username):
    value = (username or "").strip().lower()
    return DEMO_LOGIN_ALIASES.get(value, value)


def is_valid_password(user, password):
    if user.password_hash == f"temporary::{password}":
        return True

    demo_password = DEMO_PASSWORDS.get(user.email.lower())
    return demo_password is not None and password == demo_password


@router.post("/login")
def login(request: LoginRequest):
    db = SessionLocal()

    try:
        ensure_user_status_column(db)
        email = normalize_login_identifier(request.username)
        password = (request.password or "").strip()
        user = (
            db.query(models.User)
            .filter(models.User.email == email)
            .first()
        )

        if user is None or not is_valid_password(user, password):
            return {
                "success": False,
                "message": "Invalid credentials. Try the demo logins.",
            }

        if not user.is_active:
            return {
                "success": False,
                "message": "This account is deactivated. Please contact an administrator.",
            }

        return {
            "success": True,
            "message": "Login successful.",
            "user": {
                "user_id": user.user_id,
                "name": user.full_name,
                "email": user.email,
                "role": user.role,
            },
        }

    finally:
        db.close()
