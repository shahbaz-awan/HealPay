"""
Clinical Encounters API endpoints
Handles doctor clinical notes and medical coder access
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import ClinicalEncounter, MedicalCode, User, UserRole
from app.schemas.clinical import (
    ClinicalEncounterCreate,
    ClinicalEncounterResponse,
    MedicalCodeCreate,
    MedicalCodeResponse,
    EncounterForCoding
)
from app.core.security import get_current_user

router = APIRouter()


# Doctor creates clinical encounter note
@router.post("/encounters", response_model=ClinicalEncounterResponse)
def create_clinical_encounter(
    encounter: ClinicalEncounterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Doctor creates a clinical encounter with notes"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can create clinical encounters"
        )
    
    db_encounter = ClinicalEncounter(
        **encounter.dict(),
        doctor_id=current_user.id
    )
    
    db.add(db_encounter)
    db.commit()
    db.refresh(db_encounter)
    
    return db_encounter


# Get encounters for a specific patient (for doctor)
@router.get("/encounters/patient/{patient_id}", response_model=List[ClinicalEncounterResponse])
def get_patient_encounters(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all clinical encounters for a patient"""
    encounters = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.patient_id == patient_id
    ).order_by(ClinicalEncounter.encounter_date.desc()).all()
    
    return encounters


# Get pending encounters for coding (for medical coder)
@router.get("/encounters/pending-coding", response_model=List[EncounterForCoding])
def get_pending_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all encounters pending medical coding"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can access this endpoint"
        )
    
    # Get encounters with pending_coding status
    encounters = db.query(
        ClinicalEncounter.id,
        ClinicalEncounter.encounter_date,
        ClinicalEncounter.encounter_type,
        ClinicalEncounter.chief_complaint,
        ClinicalEncounter.subjective_notes,
        ClinicalEncounter.objective_findings,
        ClinicalEncounter.assessment,
        ClinicalEncounter.plan,
        ClinicalEncounter.status,
        User.first_name.label("patient_first_name"),
        User.last_name.label("patient_last_name")
    ).join(
        User, ClinicalEncounter.patient_id == User.id
    ).filter(
        ClinicalEncounter.status == "pending_coding"
    ).all()
    
    # Get doctor info for each encounter
    result = []
    for enc in encounters:
        encounter_obj = db.query(ClinicalEncounter).filter(
            ClinicalEncounter.id == enc.id
        ).first()
        
        doctor = db.query(User).filter(User.id == encounter_obj.doctor_id).first()
        
        result.append(EncounterForCoding(
            id=enc.id,
            encounter_date=enc.encounter_date,
            patient_name=f"{enc.patient_first_name} {enc.patient_last_name}",
            patient_age=45,  # TODO: Calculate from DOB
            encounter_type=enc.encounter_type,
            chief_complaint=enc.chief_complaint,
            subjective_notes=enc.subjective_notes,
            objective_findings=enc.objective_findings,
            assessment=enc.assessment,
            plan=enc.plan,
            doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}",
            status=enc.status
        ))
    
    return result


# Get specific encounter details (for coder)
@router.get("/encounters/{encounter_id}", response_model=EncounterForCoding)
def get_encounter_details(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed encounter information for coding"""
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    patient = db.query(User).filter(User.id == encounter.patient_id).first()
    doctor = db.query(User).filter(User.id == encounter.doctor_id).first()
    
    return EncounterForCoding(
        id=encounter.id,
        encounter_date=encounter.encounter_date,
        patient_name=f"{patient.first_name} {patient.last_name}",
        patient_age=45,  # TODO: Calculate from DOB
        encounter_type=encounter.encounter_type,
        chief_complaint=encounter.chief_complaint,
        subjective_notes=encounter.subjective_notes,
        objective_findings=encounter.objective_findings,
        assessment=encounter.assessment,
        plan=encounter.plan,
        doctor_name=f"Dr. {doctor.first_name} {doctor.last_name}",
        status=encounter.status
    )


# Medical coder assigns codes to encounter
@router.post("/encounters/{encounter_id}/codes", response_model=MedicalCodeResponse)
def assign_medical_code(
    encounter_id: int,
    code: MedicalCodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Medical coder assigns ICD-10 or CPT code to encounter"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can assign codes"
        )
    
    # Verify encounter exists
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    # Create medical code
    db_code = MedicalCode(
        encounter_id=encounter_id,
        coder_id=current_user.id,
        **code.dict(exclude={"encounter_id"})
    )
    
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    
    return db_code


# Get codes assigned to an encounter
@router.get("/encounters/{encounter_id}/codes", response_model=List[MedicalCodeResponse])
def get_encounter_codes(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all medical codes assigned to an encounter"""
    codes = db.query(MedicalCode).filter(
        MedicalCode.encounter_id == encounter_id
    ).all()
    
    return codes


# Mark encounter as coded
@router.put("/encounters/{encounter_id}/complete-coding")
def complete_coding(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark encounter as coded and ready for billing"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can complete coding"
        )
    
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    encounter.status = "coded"
    db.commit()
    
    return {"message": "Encounter marked as coded", "encounter_id": encounter_id}
