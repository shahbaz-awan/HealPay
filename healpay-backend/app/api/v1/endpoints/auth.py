import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import User, UserRole
from app.schemas.user import UserRegister, UserLogin, AuthResponse, UserResponse, UserUpdate
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user
)
from app.core.limiter import limiter
from datetime import datetime
from fastapi.responses import RedirectResponse
from fastapi_sso.sso.google import GoogleSSO
from app.core.config import settings
import secrets

logger = logging.getLogger(__name__)
router = APIRouter()

# ---------------------------------------------------------------------------
# Request body models (keep sensitive data OUT of query strings / URL logs)
# ---------------------------------------------------------------------------
class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class PasswordResetRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class TokenRefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register/send-otp")
@limiter.limit("5/minute")
async def send_signup_otp(request: Request, user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Send OTP for email verification during signup.
    Stores user registration data in the DB alongside the OTP.
    """
    from app.services.email_service import send_otp_email
    from app.utils.otp_utils import generate_otp, store_otp

    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    otp_code = generate_otp()

    # Pre-hash the password BEFORE storing in OTP data.
    # Never store plaintext passwords, even temporarily.
    hashed_pw = get_password_hash(user_data.password)

    # Persist OTP + registration data in DB (survives server restarts)
    store_otp(
        db=db,
        email=user_data.email,
        otp_code=otp_code,
        purpose="signup",
        expiry_minutes=3,
        user_data={
            "email": user_data.email,
            "hashed_password": hashed_pw,  # pre-hashed — never plaintext
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "phone": user_data.phone,
        },
    )

    try:
        email_sent = send_otp_email(user_data.email, otp_code, purpose="signup")
        if email_sent:
            return {"message": "OTP sent to your email. Please verify to complete registration."}
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error sending signup OTP: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP email",
        )

@router.post("/register/verify-otp", response_model=dict, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
async def verify_signup_otp(request: Request, body: OtpVerifyRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and create user account.
    """
    from app.utils.otp_utils import verify_otp, get_signup_user_data, delete_otp

    email = body.email

    # Verify OTP against DB record
    is_valid, error_msg = verify_otp(db, email, body.otp, purpose="signup")
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Retrieve stored registration data
    user_info = get_signup_user_data(db, email)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration data not found. Please start registration again.",
        )

    # Create user account — password is already hashed (stored as hashed_password)
    # Support both old (plaintext 'password') and new (pre-hashed 'hashed_password') format
    if "hashed_password" in user_info:
        hashed_password = user_info["hashed_password"]
    else:
        # Legacy fallback: re-hash if old plaintext format found
        hashed_password = get_password_hash(user_info["password"])

    new_user = User(
        email=user_info["email"],
        hashed_password=hashed_password,
        first_name=user_info["first_name"],
        last_name=user_info["last_name"],
        phone=user_info.get("phone"),
        role=UserRole.PATIENT,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Clean up OTP records
    delete_otp(db, email, purpose="signup")

    logger.info("New patient account created: %s", email)
    return {"message": "Registration successful! You can now log in.", "email": new_user.email}

@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(request: Request, response: Response, credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login endpoint for all user types.
    Returns JWT access token and user information; sets refresh token as HttpOnly cookie.
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()

    # Run bcrypt in a thread executor to avoid blocking the async event loop.
    # This is critical on low-CPU servers — synchronous bcrypt freezes all workers.
    loop = asyncio.get_event_loop()
    password_valid = False
    if user:
        password_valid = await loop.run_in_executor(
            None, verify_password, credentials.password, user.hashed_password
        )

    if not user or not password_valid:
        logger.warning("Failed login attempt for: %s", credentials.email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT tokens
    token_data = {"sub": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    # Store refresh_token in an HttpOnly cookie — NOT in the response body.
    # This prevents JavaScript (and XSS) from accessing the refresh token.
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="none",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )

    logger.info("User logged in successfully: %s", user.email)

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        first_name=user.first_name,
        last_name=user.last_name,
        phone=user.phone,
        address=None,
        city=None,
        state=None,
        zip_code=None,
        role=user.role,
        specialization=user.specialization,
        is_active=user.is_active,
        is_verified=user.is_verified,
        avatar=None,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

    # refreshToken intentionally omitted from response body (set via HttpOnly cookie above)
    return AuthResponse(
        user=user_response,
        token=access_token,
    )

@router.post("/test-login")
async def test_login(request: Request, response: Response):
    """
    Mock login — DEVELOPMENT ONLY. Disabled in production.
    """
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")

    token_data = {"sub": "admin@healpay.com", "role": "ADMIN"}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data=token_data)

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )
    return {"token": access_token}

@router.get("/benchmark-bcrypt")
async def benchmark_bcrypt():
    """CPU benchmark — DEVELOPMENT ONLY. Disabled in production."""
    if settings.ENVIRONMENT == "production":
        raise HTTPException(status_code=404, detail="Not found")
    import time
    start = time.time()
    get_password_hash("password")
    duration = time.time() - start
    return {"duration": duration, "message": "Bcrypt execution time"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile
    """
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
        specialization=current_user.specialization,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar=None,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
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
    if update_data.specialization is not None:
        current_user.specialization = update_data.specialization
    
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
        specialization=current_user.specialization,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        avatar=None,
        created_at=current_user.created_at,
        updated_at=current_user.updated_at
    )

@router.post("/forgot-password/send-code")
async def send_reset_code(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """
    Send OTP code to user's email for password reset.
    """
    from app.services.email_service import send_otp_email
    from app.utils.otp_utils import generate_otp, store_otp

    email = body.email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Don't reveal whether email exists
        return {"message": "If the email exists, a reset code has been sent"}

    otp_code = generate_otp()
    store_otp(db, email, otp_code, purpose="password_reset", expiry_minutes=6)

    try:
        email_sent = send_otp_email(email, otp_code, purpose="password_reset")
        if email_sent:
            return {"message": "Reset code sent successfully"}
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset code",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error sending reset email: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send reset code",
        )

@router.post("/forgot-password/verify-and-reset")
async def verify_and_reset(body: PasswordResetRequest, db: Session = Depends(get_db)):
    """
    Verify OTP and reset password.
    """
    from app.utils.otp_utils import verify_otp, delete_otp
    import re

    new_password = body.new_password

    # Validate password strength
    if len(new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    if not re.search(r"[A-Z]", new_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[0-9]", new_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must contain at least one number")

    # Verify OTP against DB
    is_valid, error_msg = verify_otp(db, body.email, body.otp, purpose="password_reset")
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error_msg)

    # Find user
    user = db.query(User).filter(User.email == body.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Update password and clean up
    user.hashed_password = get_password_hash(new_password)
    db.commit()
    delete_otp(db, body.email, purpose="password_reset")
    logger.info("Password reset successful for %s", body.email)
    return {"message": "Password reset successful"}

# ---------------------------------------------------------------------------
# Token Refresh
# ---------------------------------------------------------------------------
@router.post("/refresh")
async def refresh_access_token(request: Request, response: Response, db: Session = Depends(get_db)):
    """
    Exchange a valid refresh token (from HttpOnly cookie) for a new access token
    """
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        # Fallback to body if present
        try:
            body = await request.json()
            refresh_token = body.get("refresh_token")
        except Exception:
            pass

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing from cookies"
        )

    try:
        payload = decode_token(refresh_token)
    except HTTPException:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Provided token is not a refresh token"
        )

    email: str = payload.get("sub")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    token_data = {"sub": user.email, "role": user.role.value}
    new_access_token = create_access_token(data=token_data)
    new_refresh_token = create_refresh_token(data=token_data)
    
    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="none",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400,
        path="/"
    )
    
    logger.info("Token refreshed successfully for: %s", user.email)
    
    return {"token": new_access_token, "refreshToken": new_refresh_token}

@router.post("/logout")
async def logout(response: Response):
    """
    Logout user by clearing the HttpOnly refresh token cookie
    """
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="none",
        path="/"
    )
    return {"message": "Successfully logged out"}

@router.get("/debug")
async def auth_debug(request: Request, current_user: User = Depends(get_current_user)):
    """
    Debug endpoint to verify JWT extraction and cookie presence.
    Requires a valid Access Token (Bearer) to succeed.
    """
    return {
        "user": current_user.email,
        "role": current_user.role,
        "token_valid": True,
        "has_refresh_cookie": "refresh_token" in request.cookies,
        "error": None
    }


# Google SSO Configuration
google_sso = GoogleSSO(
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    redirect_uri=f"{settings.BACKEND_URL}/api/v1/auth/google/callback",
    allow_insecure_http=True
)

@router.get("/google/login")
async def google_login():
    """Redirect user to Google Login"""
    with google_sso:
        return await google_sso.get_login_redirect()

@router.get("/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google Login Callback"""
    try:
        with google_sso:
            user_info = await google_sso.verify_and_process(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to login with Google: {str(e)}")
    
    if not user_info:
        raise HTTPException(status_code=400, detail="Failed to login with Google")
    
    # Check if user exists
    user = db.query(User).filter(User.email == user_info.email).first()
    
    if not user:
        # Create new user
        # Split display_name for first/last
        names = (user_info.display_name or "").split(" ")
        first_name = names[0]
        last_name = " ".join(names[1:]) if len(names) > 1 else ""
        
        # Generate random password
        random_password = secrets.token_urlsafe(32)
        hashed_password = get_password_hash(random_password)
        
        user = User(
            email=user_info.email,
            hashed_password=hashed_password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.PATIENT, # Default role
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # Generate tokens
    token_data = {"sub": user.email, "role": user.role.value}
    access_token = create_access_token(data=token_data)
    
    # Redirect to frontend with token
    # Ensure FRONTEND_URL doesn't have trailing slash
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    return RedirectResponse(
        url=f"{frontend_url}/auth/callback?token={access_token}&role={user.role.value}"
    )
