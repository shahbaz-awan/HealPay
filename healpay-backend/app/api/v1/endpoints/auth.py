from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, UserRole
from app.schemas.user import UserRegister, UserLogin, AuthResponse, UserResponse, UserUpdate
from app.core.security import (
    verify_password, 
    get_password_hash, 
    create_access_token, 
    create_refresh_token,
    get_current_user
)
from datetime import datetime

router = APIRouter()

@router.post("/register/send-otp")
async def send_signup_otp(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Send OTP for email verification during signup
    Stores user data temporarily until OTP is verified
    """
    from app.services.email_service import send_otp_email
    from app.utils.otp_utils import generate_otp, store_otp
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate OTP
    otp_code = generate_otp()
    
    # Store OTP with user registration data
    from app.utils.otp_utils import _otp_storage
    _otp_storage[user_data.email] = {
        'code': otp_code,
        'created_at': datetime.now(),
        'expiry_minutes': 3,
        'user_data': {
            'email': user_data.email,
            'password': user_data.password,
            'first_name': user_data.first_name,
            'last_name': user_data.last_name,
            'phone': user_data.phone
        }
    }
    
    # Send OTP email
    try:
        email_sent = send_otp_email(user_data.email, otp_code, purpose="signup")
        if email_sent:
            return {"message": "OTP sent to your email. Please verify to complete registration."}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP email"
            )
    except Exception as e:
        print(f"Error sending OTP: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email"
        )

@router.post("/register/verify-otp", response_model=dict, status_code=status.HTTP_201_CREATED)
async def verify_signup_otp(email: str, otp: str, db: Session = Depends(get_db)):
    """
    Verify OTP and create user account
    """
    from app.utils.otp_utils import _otp_storage, is_otp_expired
    
    # Check if OTP exists
    if email not in _otp_storage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP found. Please request a new one."
        )
    
    stored_data = _otp_storage[email]
    stored_otp = stored_data['code']
    created_at = stored_data['created_at']
    
    # Verify OTP
    if stored_otp != otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP code"
        )
    
    # Check if expired
    if is_otp_expired(created_at, stored_data.get('expiry_minutes', 3)):
        del _otp_storage[email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP has expired. Please request a new one."
        )
    
    # Get stored user data
    user_info = stored_data.get('user_data')
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User data not found. Please start registration again."
        )
    
    # Create user account
    hashed_password = get_password_hash(user_info['password'])
    new_user = User(
        email=user_info['email'],
        hashed_password=hashed_password,
        first_name=user_info['first_name'],
        last_name=user_info['last_name'],
        phone=user_info.get('phone'),
        role=UserRole.PATIENT,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Clean up OTP storage
    del _otp_storage[email]
    
    return {
        "message": "Registration successful! You can now log in.",
        "email": new_user.email
    }

@router.post("/login", response_model=AuthResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint for all user types
    Returns JWT tokens and user information
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Generate JWT tokens
    token_data = {"sub": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)
    
    # Create user response
    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        address=None,  # Not in current model
        city=None,
        state=None,
        zip_code=None,
        role=user.role,
        is_active=True,  # Simplified - all users active
        is_verified=True,  # Simplified - all users verified
        avatar=None,  # Not in current model
        created_at=user.created_at,
        updated_at=user.updated_at
    )
    
    return AuthResponse(
        user=user_response,
        token=access_token,
        refreshToken=refresh_token
    )

@router.put("/me/update", response_model=UserResponse)
async def update_my_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update current user's own profile
    Any authenticated user can update their own first_name, last_name, and phone
    """
    # Update allowed fields
    if update_data.first_name is not None:
        current_user.first_name = update_data.first_name
    if update_data.last_name is not None:
        current_user.last_name = update_data.last_name
    if update_data.phone is not None:
        current_user.phone = update_data.phone
    
    db.commit()
    db.refresh(current_user)
    
    # Return user response
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        phone=current_user.phone,
        address=None,
        city=None,
        state=None,
        zip_code=None,
        role=current_user.role,
        is_active=True,
        is_verified=True,
        avatar=None,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.post("/forgot-password/send-code")
async def send_reset_code(email: str, db: Session = Depends(get_db)):
    """
    Send OTP code to user's email for password reset
    """
    from app.services.email_service import send_otp_email
    from app.utils.otp_utils import generate_otp, store_otp
    
    # Check if user exists
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate and store OTP
    otp_code = generate_otp()
    store_otp(db, email, otp_code)
    
    # Send email
    try:
        email_sent = send_otp_email(email, otp_code, purpose="password_reset")
        if email_sent:
            return {"message": "Reset code sent successfully"}
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send reset code"
            )
    except Exception as e:
        print(f"Error sending reset email: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset code"
        )

@router.post("/forgot-password/verify-and-reset")
async def verify_and_reset(email: str, otp: str, new_password: str, db: Session = Depends(get_db)):
    """
    Verify OTP and reset password
    """
    from app.utils.otp_utils import verify_otp
    
    # Verify OTP
    if not verify_otp(db, email, otp):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code"
        )
    
    # Find user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    
    return {"message": "Password reset successful"}
