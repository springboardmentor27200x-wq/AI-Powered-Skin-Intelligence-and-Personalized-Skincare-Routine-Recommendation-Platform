"""
DermaIQ Email & Password Reset OTP Service
Handles secure 6-digit OTP generation, email dispatch (SMTP with dev console fallback),
and verification logic for password resets.
"""
from __future__ import annotations

import logging
import secrets
import smtplib
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.config import settings
from app.core.security import hash_password
from app.models.password_reset import PasswordResetOTP
from app.models.user import User

logger = logging.getLogger(__name__)


def generate_numeric_otp(length: int = 6) -> str:
    """Generates a cryptographically secure numeric OTP string (e.g. 6 digits: 100000 - 999999)."""
    return f"{secrets.randbelow(900000) + 100000}"


def build_otp_html_email(recipient_name: str, otp_code: str) -> str:
    """Builds a responsive, clinical luxury branded HTML email for password reset."""
    return f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DermaIQ Password Reset Code</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; color: #1e293b; }}
    .container {{ max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }}
    .header {{ background: #162822; padding: 32px 24px; text-align: center; border-bottom: 3px solid #c89b27; }}
    .logo-text {{ color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }}
    .subtitle {{ color: #c89b27; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 6px; }}
    .content {{ padding: 36px 32px; }}
    .greeting {{ font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }}
    .message {{ font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }}
    .otp-box {{ background: #f0fdf4; border: 2px dashed #2d6b51; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }}
    .otp-label {{ font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #2d6b51; font-weight: 700; margin-bottom: 8px; }}
    .otp-digits {{ font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #162822; }}
    .expiry {{ font-size: 12px; color: #64748b; margin-top: 8px; }}
    .notice {{ background: #f8fafc; border-radius: 8px; padding: 14px 18px; border-left: 4px solid #c89b27; font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 24px; }}
    .footer {{ background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="logo-text">DermaIQ</h1>
      <div class="subtitle">AI Skin Intelligence &amp; Clinical Care</div>
    </div>
    <div class="content">
      <div class="greeting">Hello {recipient_name or 'there'},</div>
      <p class="message">
        We received a request to reset the password for your DermaIQ account. Use the 6-digit verification code below to complete the reset:
      </p>
      <div class="otp-box">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-digits">{otp_code}</div>
        <div class="expiry">Expires in 10 minutes</div>
      </div>
      <p class="message">
        Enter this code on the password reset screen to set a new password. For security reasons, do not share this code with anyone.
      </p>
      <div class="notice">
        <strong>Didn't request this?</strong> If you did not request a password reset, you can safely ignore this email. Your current password remains secure.
      </div>
    </div>
    <div class="footer">
      &copy; 2026 DermaIQ Skin Intelligence Platform. All rights reserved.
    </div>
  </div>
</body>
</html>"""


def send_otp_email(recipient_email: str, recipient_name: str, otp_code: str) -> bool:
    """
    Dispatches OTP verification email.
    If SMTP settings are populated, uses SMTP server.
    If not populated or if connection fails, logs prominently to server console
    so development, testing, and mentor demos operate without failures.
    """
    subject = f"{otp_code} is your DermaIQ Password Reset Code"
    html_content = build_otp_html_email(recipient_name, otp_code)
    text_content = (
        f"DermaIQ Password Reset\n\n"
        f"Your 6-digit verification code is: {otp_code}\n\n"
        f"This code will expire in 10 minutes.\n"
        f"If you did not request a password reset, please ignore this message."
    )

    # 1. Attempt sending via SMTP if host is configured
    if settings.SMTP_HOST and settings.SMTP_HOST.strip():
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = recipient_email

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            if settings.SMTP_PORT == 465:
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            else:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                if settings.SMTP_TLS:
                    server.starttls()

            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)

            server.sendmail(settings.EMAILS_FROM_EMAIL, [recipient_email], msg.as_string())
            server.quit()
            logger.info(f"📧 Password reset email successfully sent via SMTP to {recipient_email}")
            return True
        except Exception as smtp_err:
            logger.warning(f"SMTP dispatch to {recipient_email} failed: {smtp_err}. Falling back to console output.")

    # 2. Console fallback (development, test suites, and offline mentor demonstrations)
    print("\n" + "=" * 65)
    print(f"📧 [DermaIQ EMAIL SERVICE] PASSWORD RESET OTP DISPATCH")
    print(f"To:        {recipient_email} ({recipient_name or 'User'})")
    print(f"Subject:   {subject}")
    print(f"OTP Code:  >>>  {otp_code}  <<<")
    print(f"Expires:   10 minutes from now")
    print("=" * 65 + "\n")
    logger.info(f"[DEV EMAIL OTP] Reset code for {recipient_email}: {otp_code}")
    return True


def create_and_send_reset_otp(db: Session, email: str, user: Optional[User] = None) -> Tuple[PasswordResetOTP, str]:
    """
    Invalidates any existing unused OTPs for this email,
    generates a new 6-digit OTP, stores it in database, and dispatches the email.
    """
    email_clean = email.strip().lower()

    # Invalidate previous unused OTPs for this email
    active_otps = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email_clean, PasswordResetOTP.is_used == False)
        .all()
    )
    for old_otp in active_otps:
        old_otp.is_used = True

    # Generate fresh OTP code
    otp_code = generate_numeric_otp(6)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    reset_record = PasswordResetOTP(
        user_id=user.id if user else None,
        email=email_clean,
        otp_code=otp_code,
        expires_at=expires_at,
        is_used=False,
        attempts=0,
    )
    db.add(reset_record)
    db.commit()
    db.refresh(reset_record)

    # Dispatch email
    recipient_name = user.profile.name if (user and user.profile and user.profile.name) else ""
    send_otp_email(email_clean, recipient_name, otp_code)

    return reset_record, otp_code


def verify_reset_otp(db: Session, email: str, otp_code: str) -> Tuple[bool, str, Optional[PasswordResetOTP]]:
    """
    Validates the supplied OTP against the latest active record.
    Returns (is_valid, message, otp_record).
    """
    email_clean = email.strip().lower()
    otp_clean = otp_code.strip()

    record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.email == email_clean, PasswordResetOTP.is_used == False)
        .order_by(desc(PasswordResetOTP.created_at))
        .first()
    )

    if not record:
        return False, "No active password reset request found for this email. Please request a new code.", None

    if record.is_expired():
        record.is_used = True
        db.commit()
        return False, "Verification code has expired. Please request a new code.", None

    if record.attempts >= 5:
        record.is_used = True
        db.commit()
        return False, "Too many failed attempts. For your security, this code has been deactivated. Please request a new code.", None

    if record.otp_code != otp_clean:
        record.attempts += 1
        db.commit()
        remaining = max(0, 5 - record.attempts)
        return False, f"Invalid verification code. {remaining} attempt(s) remaining.", None

    return True, "Verification code confirmed successfully.", record


def execute_password_reset(db: Session, email: str, otp_code: str, new_password: str) -> Tuple[bool, str]:
    """
    Validates OTP, verifies user existence, updates hashed_password, and marks OTP as used.
    """
    is_valid, message, otp_record = verify_reset_otp(db, email, otp_code)
    if not is_valid or not otp_record:
        return False, message

    email_clean = email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user:
        return False, "User account not found."

    # Update password
    user.hashed_password = hash_password(new_password)
    user.updated_at = datetime.now(timezone.utc)
    
    # Mark OTP as used
    otp_record.is_used = True
    
    db.commit()
    logger.info(f"Password successfully reset for user: {email_clean}")
    return True, "Password has been successfully updated. You can now sign in with your new password."
