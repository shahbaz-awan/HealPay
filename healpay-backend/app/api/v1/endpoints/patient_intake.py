from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.db.models import PatientIntake, User, UserRole
from app.schemas.patient_intake import (
    PatientIntakeCreate,
    PatientIntakeUpdate,
    PatientIntakeResponse
)
from app.core.security import get_current_user

router = APIRouter()

@router.post("/", response_model=PatientIntakeResponse, status_code=status.HTTP_201_CREATED)
async def create_patient_intake(
    intake_data: PatientIntakeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create patient intake form (Patient only)
    """
    # Only patients can create their own intake
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can create intake forms"
        )
    
    # Check if intake already exists
    existing_intake = db.query(PatientIntake).filter(
        PatientIntake.user_id == current_user.id
    ).first()
    
    if existing_intake:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Patient intake form already exists. Use update endpoint instead."
        )
    
    # Create new intake
    new_intake = PatientIntake(
        user_id=current_user.id,
        **intake_data.model_dump()
    )
    
    db.add(new_intake)
    db.commit()
    db.refresh(new_intake)
    
    return new_intake

@router.get("/my-intake", response_model=PatientIntakeResponse)
async def get_my_patient_intake(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current patient's intake form
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can access this endpoint"
        )
    
    intake = db.query(PatientIntake).filter(
        PatientIntake.user_id == current_user.id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient intake form not found. Please complete the intake form."
        )
    
    return intake

@router.put("/my-intake", response_model=PatientIntakeResponse)
async def update_my_patient_intake(
    intake_data: PatientIntakeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update current patient's intake form
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can update their intake form"
        )
    
    intake = db.query(PatientIntake).filter(
        PatientIntake.user_id == current_user.id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient intake form not found"
        )
    
    # Update fields
    update_data = intake_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(intake, field, value)
    
    db.commit()
    db.refresh(intake)
    
    return intake

@router.get("/{user_id}", response_model=PatientIntakeResponse)
async def get_patient_intake_by_id(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get patient intake by user ID (Admin, Doctor, Coder only)
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.CODER, UserRole.BILLING]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view patient intake forms"
        )
    
    intake = db.query(PatientIntake).filter(
        PatientIntake.user_id == user_id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient intake form not found"
        )
    
    return intake

@router.get("/", response_model=List[PatientIntakeResponse])
async def get_all_patient_intakes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all patient intake forms (Admin, Doctor, Coder only)
    """
    # Check permissions
    if current_user.role not in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.CODER, UserRole.BILLING]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view all patient intake forms"
        )
    
    intakes = db.query(PatientIntake).offset(skip).limit(limit).all()
    return intakes

@router.delete("/my-intake", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_patient_intake(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete current patient's intake form
    """
    if current_user.role != UserRole.PATIENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only patients can delete their intake form"
        )
    
    intake = db.query(PatientIntake).filter(
        PatientIntake.user_id == current_user.id
    ).first()
    
    if not intake:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient intake form not found"
        )
    
    db.delete(intake)
    db.commit()
    
    return None
