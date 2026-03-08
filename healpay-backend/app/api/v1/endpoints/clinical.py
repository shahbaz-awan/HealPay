"""
Clinical Encounters API endpoints
Handles doctor clinical notes and medical coder access
"""
import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date

from app.db.database import get_db
from app.db.models import ClinicalEncounter, MedicalCode, User, UserRole, CodeLibrary, PatientIntake
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

logger = logging.getLogger(__name__)
router = APIRouter()


def _calculate_age(dob_str: Optional[str]) -> int:
    """Calculate age in years from a date-of-birth string (YYYY-MM-DD). Returns 0 if unparseable."""
    if not dob_str:
        return 0
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except (ValueError, TypeError):
        return 0


def _get_patient_age(db: Session, patient_id: int) -> int:
    """Look up the patient's age from their intake form DOB."""
    intake = db.query(PatientIntake).filter(PatientIntake.user_id == patient_id).first()
    if intake and intake.date_of_birth:
        return _calculate_age(intake.date_of_birth)
    return 0


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


# Doctor explicitly submits an encounter for coding
@router.put("/encounters/{encounter_id}/submit-for-coding", response_model=ClinicalEncounterResponse)
def submit_encounter_for_coding(
    encounter_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Doctor marks an encounter as ready for medical coding"""
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors and admins can submit encounters for coding"
        )

    encounter = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.id == encounter_id
    ).first()

    if not encounter:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Encounter not found"
        )

    # Verify the doctor owns this encounter (admins can bypass)
    if current_user.role == UserRole.DOCTOR and encounter.doctor_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own encounters for coding"
        )

    encounter.status = "pending_coding"
    db.commit()
    db.refresh(encounter)

    logger.info(f"Encounter {encounter_id} submitted for coding by doctor {current_user.id}")
    return encounter


# Get pending encounters for coding (for medical coder)
@router.get("/encounters/pending-coding", response_model=List[EncounterForCoding])
def get_pending_encounters(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get encounters pending medical coding (paginated)."""
    if current_user.role != UserRole.CODER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only medical coders can access this endpoint"
        )

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
    ).order_by(
        ClinicalEncounter.encounter_date.asc()   # oldest first → highest priority
    ).offset(skip).limit(limit).all()

    result = []
    for enc in encounters:
        encounter_obj = db.query(ClinicalEncounter).filter(ClinicalEncounter.id == enc.id).first()
        doctor = db.query(User).filter(User.id == encounter_obj.doctor_id).first()
        result.append(EncounterForCoding(
            id=enc.id,
            encounter_date=enc.encounter_date,
            patient_name=f"{enc.patient_first_name} {enc.patient_last_name}",
            patient_age=_get_patient_age(db, encounter_obj.patient_id),
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
            patient_age=_get_patient_age(db, encounter_obj.patient_id),
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
        patient_age=_get_patient_age(db, encounter.patient_id),
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
    Get AI-powered medical code recommendations for a clinical encounter.
    Validates that the chief complaint is a recognisable medical text before running the model.
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

    # Require chief complaint
    if not encounter.chief_complaint or not encounter.chief_complaint.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Chief complaint is required before generating AI recommendations. "
                   "Please add a chief complaint to the encounter first.",
        )

    # Get recommendation service (loads library + model on first call)
    try:
        rec_service = get_recommendation_service(db)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"AI service could not be initialised: {exc}",
        )

    # ── Validate the chief complaint is medical ──────────────────────────────
    try:
        is_medical, reason = rec_service.validate_medical_text(encounter.chief_complaint)
    except Exception:
        is_medical, reason = True, ""  # If validation itself fails, proceed

    if not is_medical:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=reason,
        )

    # ── Generate recommendations ─────────────────────────────────────────────
    try:
        icd_recommendations = rec_service.get_recommendations(
            encounter=encounter,
            code_type='ICD10_CM',
            top_n=5
        )
        cpt_recommendations = rec_service.get_recommendations(
            encounter=encounter,
            code_type='CPT',
            top_n=3
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI recommendation engine error: {exc}",
        )

    return RecommendationResponse(
        encounter_id=encounter_id,
        icd10_recommendations=[CodeRecommendation(**rec) for rec in icd_recommendations],
        cpt_recommendations=[CodeRecommendation(**rec) for rec in cpt_recommendations],
        total_recommendations=len(icd_recommendations) + len(cpt_recommendations)
    )

# Get encounters ready for billing (For Biller)
@router.get("/billingready")
def get_ready_to_bill_encounters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all encounters that have been coded/sent to biller and are ready for claim generation.
    """
    # Note: Access control - ideally check for BILLING role, but we'll accept authentic users for now or check Biller
    # if current_user.role != UserRole.BILLER: ...

    encounters = db.query(ClinicalEncounter).filter(
        ClinicalEncounter.status.in_(['coded', 'sent_to_biller'])
    ).all()
    
    results = []
    for enc in encounters:
        patient = db.query(User).filter(User.id == enc.patient_id).first()
        doctor = db.query(User).filter(User.id == enc.doctor_id).first()
        
        results.append({
            "id": enc.id,
            "encounter_date": enc.encounter_date,
            "patient_name": f"{patient.first_name} {patient.last_name}" if patient else "Unknown",
            "doctor_name": f"{doctor.first_name} {doctor.last_name}" if doctor else "Unknown",
            "type": enc.encounter_type,
            "status": enc.status
        })
        
    return results
