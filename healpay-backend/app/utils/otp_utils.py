import random
import string
from datetime import datetime, timedelta

def generate_otp(length: int = 4) -> str:
    """
    Generate a random OTP code.
    
    Args:
        length: Length of OTP (default 4)
    
    Returns:
        Random numeric OTP as string
    """
    return ''.join(random.choices(string.digits, k=length))


def verify_otp(stored_otp: str, input_otp: str, created_at: datetime, expiry_minutes: int = 3) -> tuple[bool, str]:
    """
    Verify OTP code and check expiration.
    
    Args:
        stored_otp: OTP stored in database
        input_otp: OTP entered by user
        created_at: When OTP was created
        expiry_minutes: OTP validity period (default 3 minutes)
    
    Returns:
        (is_valid, error_message)
    """
    if not stored_otp:
        return False, "No OTP found. Please request a new one."
    
    # Check if OTP matches
    if stored_otp != input_otp:
        return False, "Invalid OTP code."
    
    # Check if OTP has expired
    expiry_time = created_at + timedelta(minutes=expiry_minutes)
    if datetime.now() > expiry_time:
        return False, "OTP has expired. Please request a new one."
    
    return True, "OTP verified successfully."


def is_otp_expired(created_at: datetime, expiry_minutes: int = 3) -> bool:
    """
    Check if OTP has expired.
    
    Args:
        created_at: When OTP was created
        expiry_minutes: OTP validity period (default 3 minutes)
    
    Returns:
        True if expired, False otherwise
    """
    if not created_at:
        return True
    
    expiry_time = created_at + timedelta(minutes=expiry_minutes)
    return datetime.now() > expiry_time


# Simple in-memory OTP storage for password reset
_otp_storage = {}

def store_otp(db, email: str, otp_code: str, expiry_minutes: int = 3):
    """
    Store OTP code for email verification/password reset
    
    Args:
        db: Database session
        email: User's email
        otp_code: Generated OTP
        expiry_minutes: OTP validity period
    """
    _otp_storage[email] = {
        'code': otp_code,
        'created_at': datetime.now(),
        'expiry_minutes': expiry_minutes
    }
    print(f"Stored OTP for {email}: {otp_code}")


def verify_otp(db, email: str, input_otp: str) -> bool:
    """
    Verify OTP code from storage
    
    Args:
        db: Database session
        email: User's email
        input_otp: OTP entered by user
    
    Returns:
        True if valid, False otherwise
    """
    if email not in _otp_storage:
        print(f"No OTP found for {email}")
        return False
    
    stored_data = _otp_storage[email]
    stored_otp = stored_data['code']
    created_at = stored_data['created_at']
    expiry_minutes = stored_data.get('expiry_minutes', 3)
    
    # Check if OTP matches
    if stored_otp != input_otp:
        print(f"OTP mismatch for {email}: expected {stored_otp}, got {input_otp}")
        return False
    
    # Check if expired
    if is_otp_expired(created_at, expiry_minutes):
        print(f"OTP expired for {email}")
        del _otp_storage[email]  # Clean up expired OTP
        return False
    
    # Valid OTP - remove from storage
    del _otp_storage[email]
    print(f"OTP verified successfully for {email}")
    return True
