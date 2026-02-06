"""
Clinical Encounters API endpoints
Handles doctor clinical notes and medical coder access
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import ClinicalEncounter, MedicalCode, User, UserRole, CodeLibrary
from app.schemas.clinical import (
    ClinicalEncounterCreate,
    ClinicalEncounterResponse,
    MedicalCodeCreate,
    MedicalCodeResponse,
    EncounterForCoding,
    RecommendationResponse,
    CodeRecommendation
)
from app.core.security import get_current_user
from app.services.recommendation_service import get_recommendation_service

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


# Get completed encounters (for coder to view coded encounters)
@router.get("/encounters/completed", response_model=List[EncounterForCoding])
def get_completed_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all encounters that have been coded (completed)"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can access this endpoint"
        )
    
    # Get encounters with coded, sent_to_biller, or sent_to_doctor status
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
        ClinicalEncounter.status.in_(["coded", "sent_to_biller", "sent_to_doctor"])
    ).order_by(ClinicalEncounter.encounter_date.desc()).all()
    
    # Get doctor info for each encounter
    result = []
    for enc in encounters:
        encounter_obj = db.query(ClinicalEncounter).filter(
            ClinicalEncounter.id == enc.id
        ).first()
        
        doctor = db.query(User).filter(User.id == encounter_obj.doctor_id).first()
        
        # Get count of assigned codes
        code_count = db.query(MedicalCode).filter(
            MedicalCode.encounter_id == enc.id
        ).count()
        
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


# Delete an assigned medical code
@router.delete("/encounters/{encounter_id}/codes/{code_id}")
def delete_medical_code(
    encounter_id: int,
    code_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a medical code assigned to an encounter"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can delete codes"
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
    
    # Find and delete the code
    code = db.query(MedicalCode).filter(
        MedicalCode.id == code_id,
        MedicalCode.encounter_id == encounter_id
    ).first()
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code not found"
        )
    
    db.delete(code)
    db.commit()
    
    return {"message": "Code deleted successfully", "code_id": code_id}


# Update an assigned medical code
@router.put("/encounters/{encounter_id}/codes/{code_id}", response_model=MedicalCodeResponse)
def update_medical_code(
    encounter_id: int,
    code_id: int,
    code_update: MedicalCodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a medical code assigned to an encounter"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can update codes"
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
    
    # Find the code
    code = db.query(MedicalCode).filter(
        MedicalCode.id == code_id,
        MedicalCode.encounter_id == encounter_id
    ).first()
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Code not found"
        )
    
    # Update fields
    code.code = code_update.code
    code.code_type = code_update.code_type
    code.description = code_update.description
    code.is_ai_suggested = code_update.is_ai_suggested
    code.confidence_score = code_update.confidence_score
    
    db.commit()
    db.refresh(code)
    
    return code



# Send encounter to biller or doctor for review
@router.put("/encounters/{encounter_id}/send-to")
def send_encounter_to(
    encounter_id: int,
    target: str,  # "biller" or "doctor"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a coded encounter to biller or doctor for review"""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can send encounters"
        )
    
    if target not in ["biller", "doctor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target must be 'biller' or 'doctor'"
        )
    
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    # Only allow sending coded encounters
    if encounter.status not in ["coded", "sent_to_biller", "sent_to_doctor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Encounter must be coded before sending"
        )
    
    # Update status
    encounter.status = f"sent_to_{target}"
    db.commit()
    
    return {
        "message": f"Encounter sent to {target} successfully",
        "encounter_id": encounter_id,
        "new_status": encounter.status
    }


# Search code library (for coders)
@router.get("/codes/search")
def search_code_library(
    query: str,
    code_type: str = None,  # "ICD10_CM" or "CPT"
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search the code library database for ICD-10 or CPT codes
    Returns codes matching the query in code number or description
    """
    if current_user.role not in [UserRole.CODER, UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only coders, doctors, and admins can search codes"
        )
    
    # Build base query
    code_query = db.query(CodeLibrary)
    
    # Filter by code type if provided
    if code_type:
        code_query = code_query.filter(CodeLibrary.code_type == code_type)
    
    # Search in code or description (case-insensitive)
    if query:
        search_filter = (
            CodeLibrary.code.ilike(f"%{query}%") |
            CodeLibrary.short_description.ilike(f"%{query}%") |
            CodeLibrary.long_description.ilike(f"%{query}%")
        )
        code_query = code_query.filter(search_filter)
    
    # Limit results
    codes = code_query.limit(limit).all()
    
    # Format response
    results = []
    for code in codes:
        results.append({
            "code": code.code,
            "code_type": code.code_type,
            "description": code.short_description,
            "long_description": code.long_description
        })
    
    return {
        "results": results,
        "count": len(results),
        "query": query,
        "code_type": code_type
    }


# Get AI-powered code recommendations for encounter
@router.get("/encounters/{encounter_id}/recommendations", response_model=RecommendationResponse)
def get_code_recommendations(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get AI-powered medical code recommendations for a clinical encounter
    Returns ICD-10 diagnosis codes and CPT procedure codes with explanations
    """
    if current_user.role not in [UserRole.CODER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders and admins can access recommendations"
        )
    
    # Get encounter
    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()
    
    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )
    
    # Get recommendation service
    rec_service = get_recommendation_service(db)
    
    # Get ICD-10 recommendations (diagnosis codes)
    icd_recommendations = rec_service.get_recommendations(
        encounter=encounter,
        code_type='ICD10_CM',
        top_n=5
    )
    
    # Get CPT recommendations (procedure codes)
    cpt_recommendations = rec_service.get_recommendations(
        encounter=encounter,
        code_type='CPT',
        top_n=3
    )
    
    return RecommendationResponse(
        encounter_id=encounter_id,
        icd10_recommendations=[CodeRecommendation(**rec) for rec in icd_recommendations],
        cpt_recommendations=[CodeRecommendation(**rec) for rec in cpt_recommendations],
        total_recommendations=len(icd_recommendations) + len(cpt_recommendations)
    )
