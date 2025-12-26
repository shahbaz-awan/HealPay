from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import User
from app.schemas.user import UserRegister, AuthResponse, UserResponse, UserUpdate
from app.core.security import get_password_hash, create_access_token, create_refresh_token

router = APIRouter()

@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Get all users - Admin endpoint
    Returns all user information except passwords
    """
    users = db.query(User).offset(skip).limit(limit).all()
    
    # Convert each user to UserResponse format
    user_responses = []
    for user in users:
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
            avatar=None,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        user_responses.append(user_response)
    
    return user_responses

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a specific user by ID
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_update: UserUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user information including password and email
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields if provided
    update_data = user_update.dict(exclude_unset=True)
    
    # Hash password if it's being updated
    if 'password' in update_data and update_data['password']:
        update_data['hashed_password'] = get_password_hash(update_data['password'])
        del update_data['password']  # Remove plain password
    
    # Update user fields
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a user
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    db.delete(user)
    db.commit()
    return {"message": f"User {user.email} deleted successfully"}

@router.post("/create-user", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserRegister, 
    db: Session = Depends(get_db)
):
    """
    Admin endpoint to create users with any role
    User can immediately login after creation
    """
    from app.db.models import UserRole as DBUserRole
    
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with specified role
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        phone=user_data.phone,
        role=user_data.role,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create tokens for the user
    access_token = create_access_token(data={"sub": new_user.email, "role": new_user.role.value})
    refresh_token = create_refresh_token(data={"sub": new_user.email, "role": new_user.role.value})
    
    # Prepare response
    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        first_name=new_user.first_name,
        last_name=new_user.last_name,
        phone=new_user.phone,
        address=None,
        city=None,
        state=None,
        zip_code=None,
        role=new_user.role,
        is_active=True,  # Simplified - all users active
        is_verified=True,  # Simplified - all users verified
        avatar=None,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )
    
    return {
        "user": user_response,
        "token": access_token,
        "refreshToken": refresh_token
    }


