from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
import re

class UserRole(str, Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    CODER = "CODER"
    BILLING = "BILLING"
    ADMIN = "ADMIN"

# User Registration Schema
class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    role: UserRole
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password contains uppercase, lowercase, number, and special character"""
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[^a-zA-Z0-9]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: str) -> str:
        """Validate that name contains only alphabets, spaces, hyphens, and apostrophes"""
        if not re.match(r"^[A-Za-z\s'\-]+$", v):
            raise ValueError('Name can only contain letters, spaces, hyphens, and apostrophes')
        # Remove extra spaces and title case
        return ' '.join(v.split()).title()
    
    @field_validator('city', 'state')
    @classmethod
    def validate_location(cls, v: Optional[str]) -> Optional[str]:
        """Validate that city/state contains only alphabets and spaces"""
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('City/State must contain only alphabets and spaces')
        return ' '.join(v.split()).title()
    
    @field_validator('phone')
    @classmethod
    def validate_phone(cls, v: Optional[str]) -> Optional[str]:
        """Validate phone number contains only digits and common formatting characters"""
        if not v:
            return v
        
        # Allow only digits and common formatting characters
        if not re.match(r'^[\d\s\-\(\)\+]+$', v):
            raise ValueError('Phone number can only contain digits and formatting characters (+, -, (), spaces)')
        
        # Extract just the digits to check length
        digits_only = re.sub(r'[^\d]', '', v)
        if len(digits_only) < 10:
            raise ValueError('Phone number must contain at least 10 digits')
        if len(digits_only) > 15:
            raise ValueError('Phone number cannot exceed 15 digits')
        
        return v

# User Login Schema
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# User Response Schema
class UserResponse(BaseModel):
    id: int
    email: str
    first_name: str
    last_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    role: UserRole
    specialization: Optional[str] = None
    is_active: bool
    is_verified: bool
    avatar: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# User Update Schema
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=8)
    first_name: Optional[str] = Field(None, min_length=2, max_length=50)
    last_name: Optional[str] = Field(None, min_length=2, max_length=50)
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    specialization: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: Optional[str]) -> Optional[str]:
        """Validate password contains uppercase, lowercase, number, and special character"""
        if v is None:
            return v
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[^a-zA-Z0-9]', v):
            raise ValueError('Password must contain at least one special character')
        return v
    
    @field_validator('first_name', 'last_name')
    @classmethod
    def validate_name(cls, v: Optional[str]) -> Optional[str]:
        """Validate that name contains only alphabets and spaces"""
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('Name must contain only alphabets and spaces')
        return ' '.join(v.split()).title()
    
    @field_validator('city', 'state')
    @classmethod
    def validate_location(cls, v: Optional[str]) -> Optional[str]:
        """Validate that city/state contains only alphabets and spaces"""
        if v is None:
            return v
        if not re.match(r'^[a-zA-Z\s]+$', v):
            raise ValueError('City/State must contain only alphabets and spaces')
        return ' '.join(v.split()).title()

# Token Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[UserRole] = None

# Auth Response (Login/Register)
class AuthResponse(BaseModel):
    user: UserResponse
    token: str
    refreshToken: Optional[str] = None

    class Config:
        from_attributes = True

# OTP Schemas
class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")

class PasswordReset(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6, pattern="^[0-9]{6}$")
    new_password: str = Field(..., min_length=8)

class ResendOTPRequest(BaseModel):
    email: EmailStr
    purpose: str = Field(..., pattern="^(verification|password_reset)$")

