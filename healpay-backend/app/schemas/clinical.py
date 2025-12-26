from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# Clinical Encounter Schemas
class ClinicalEncounterBase(BaseModel):
    patient_id: int
    encounter_type: str
    chief_complaint: str
    subjective_notes: Optional[str] = None
    objective_findings: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None


class ClinicalEncounterCreate(ClinicalEncounterBase):
    pass


class ClinicalEncounterResponse(ClinicalEncounterBase):
    id: int
    doctor_id: int
    encounter_date: datetime
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# Medical Code Schemas
class MedicalCodeBase(BaseModel):
    code_type: str  # "ICD-10" or "CPT"
    code: str
    description: str
    is_ai_suggested: bool = False
    confidence_score: Optional[float] = None


class MedicalCodeCreate(MedicalCodeBase):
    encounter_id: int


class MedicalCodeResponse(MedicalCodeBase):
    id: int
    encounter_id: int
    coder_id: int
    created_at: datetime
   
    class Config:
        from_attributes = True


# Claim Schemas
class ClaimBase(BaseModel):
    claim_number: str
    insurance_provider: str
    total_amount: float
    patient_responsibility: Optional[float] = None


class ClaimCreate(ClaimBase):
    encounter_id: int


class ClaimResponse(ClaimBase):
    id: int
    encounter_id: int
    status: str
    submitted_at: datetime
    
    class Config:
        from_attributes = True


# For Coder Dashboard - Encounter with Patient Info
class EncounterForCoding(BaseModel):
    id: int
    encounter_date: datetime
    patient_name: str
    patient_age: int
    encounter_type: str
    chief_complaint: str
    subjective_notes: Optional[str]
    objective_findings: Optional[str]
    assessment: Optional[str]
    plan: Optional[str]
    doctor_name: str
    status: str
    
    class Config:
        from_attributes = True
