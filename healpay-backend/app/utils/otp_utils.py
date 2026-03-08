"""
OTP Utilities — DB-backed storage (replaces the in-memory dict).

All OTP records are stored in the ``otp_verifications`` table so they
survive server restarts and work correctly under multiple Uvicorn workers.
Old (unused) records for the same email+purpose are deleted on each new
issuance to prevent stale data build-up.
"""
import json
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Tuple

from sqlalchemy.orm import Session


def generate_otp(length: int = 6) -> str:
    """Return a cryptographically secure numeric OTP string."""
    return "".join(secrets.choice(string.digits) for _ in range(length))


def store_otp(
    db: Session,
    email: str,
    otp_code: str,
    purpose: str = "password_reset",
    expiry_minutes: int = 6,
    user_data: Optional[dict] = None,
) -> None:
    """
    Persist an OTP in the database.

    Args:
        db: Active SQLAlchemy session.
        email: Recipient's email address.
        otp_code: The generated OTP string.
        purpose: "signup" or "password_reset".
        expiry_minutes: How many minutes until the OTP expires.
        user_data: Optional dict of registration data (for signup OTPs).
    """
    from app.db.models import OtpVerification

    # Remove any previous OTPs for this email+purpose (prevents stale reuse)
    db.query(OtpVerification).filter(
        OtpVerification.email == email,
        OtpVerification.purpose == purpose,
    ).delete(synchronize_session=False)

    expires_at = datetime.utcnow() + timedelta(minutes=expiry_minutes)
    record = OtpVerification(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        user_data=json.dumps(user_data) if user_data else None,
        expires_at=expires_at,
        used=False,
    )
    db.add(record)
    db.commit()


def verify_otp(
    db: Session,
    email: str,
    input_otp: str,
    purpose: str = "password_reset",
) -> Tuple[bool, str]:
    """
    Verify an OTP from the database.

    Returns:
        (is_valid, error_message)  — error_message is empty on success.
    """
    from app.db.models import OtpVerification

    record: Optional[OtpVerification] = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.email == email,
            OtpVerification.purpose == purpose,
            OtpVerification.used == False,  # noqa: E712
        )
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if not record:
        return False, "No OTP found. Please request a new one."

    if record.otp_code != input_otp:
        return False, "Invalid OTP code."

    if datetime.utcnow() > record.expires_at.replace(tzinfo=None):
        # Clean up expired record
        db.delete(record)
        db.commit()
        return False, "OTP has expired. Please request a new one."

    # Mark as used and commit
    record.used = True
    db.commit()
    return True, ""


def get_signup_user_data(db: Session, email: str) -> Optional[dict]:
    """
    Retrieve the registration payload stored alongside a signup OTP.
    Only returns data for a verified (used=True) record.
    """
    from app.db.models import OtpVerification

    record: Optional[OtpVerification] = (
        db.query(OtpVerification)
        .filter(
            OtpVerification.email == email,
            OtpVerification.purpose == "signup",
            OtpVerification.used == True,  # noqa: E712
        )
        .order_by(OtpVerification.created_at.desc())
        .first()
    )

    if record and record.user_data:
        return json.loads(record.user_data)
    return None


def delete_otp(db: Session, email: str, purpose: str = "signup") -> None:
    """Delete all OTP records for an email+purpose after successful use."""
    from app.db.models import OtpVerification

    db.query(OtpVerification).filter(
        OtpVerification.email == email,
        OtpVerification.purpose == purpose,
    ).delete(synchronize_session=False)
    db.commit()


def is_otp_expired(created_at: datetime, expiry_minutes: int = 3) -> bool:
    """Legacy helper — kept for compatibility."""
    if not created_at:
        return True
    return datetime.now() > created_at + timedelta(minutes=expiry_minutes)
