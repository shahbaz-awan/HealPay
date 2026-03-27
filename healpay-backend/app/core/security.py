from datetime import datetime, timedelta
from typing import Optional, Callable
from jose import JWTError, jwt
import bcrypt
from fastapi import HTTPException, status, Depends
from app.core.config import settings

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password: str) -> str:
    """Hash a password"""
    # Use 4 rounds on Koeyb to prevent >15s synchronous CPU locking during login
    salt = bcrypt.gensalt(rounds=4)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> dict:
    """Decode and verify JWT token"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

# Import FastAPI dependencies at module level
from fastapi import Depends
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from app.db.database import get_db

security_scheme = HTTPBearer()

async def get_current_user(
    token: str = Depends(security_scheme),
    db: Session = Depends(get_db)
):
    """FastAPI dependency to get current authenticated user"""
    from app.db.models import User
    
    # Extract token from HTTPBearer
    token_str = token.credentials if hasattr(token, 'credentials') else token
    
    # Decode token
    payload = decode_token(token_str)
    email: str = payload.get("sub")
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        )
    
    # Verify this is an access token, not a refresh token
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    # Get user from database
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user


def require_roles(*roles):
    """Factory dependency that enforces one of the specified roles.

    Usage::

        @router.get("/admin-only")
        def admin_only(current_user: User = Depends(require_roles(UserRole.ADMIN))):
            ...
    """
    async def role_checker(
        current_user=Depends(get_current_user),
    ):
        from app.db.models import UserRole
        if current_user.role not in roles:
            allowed = ", ".join(r.value for r in roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {allowed}.",
            )
        return current_user

    return role_checker
