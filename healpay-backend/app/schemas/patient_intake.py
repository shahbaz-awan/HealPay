from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime

class MedicationItem(BaseModel):
    name: str
    dosage: str
    frequency: str

class AllergyItem(BaseModel):
    allergen: str
    reaction: str
    severity: str  # mild, moderate, severe

class SurgeryItem(BaseModel):
    procedure: str
    date: str
    hospital: Optional[str] = None

class ConditionItem(BaseModel):
    condition: str
    diagnosed_date: Optional[str] = None

class FamilyHistoryItem(BaseModel):
    relationship: str
    condition: str

class PatientIntakeCreate(BaseModel):
    # Personal Information
    ssn: Optional[str] = None
    date_of_birth: str
    gender: str
    marital_status: Optional[str] = None
    preferred_language: Optional[str] = "English"
    race_ethnicity: Optional[str] = None
    
    # Contact Information
    phone_primary: str
    phone_secondary: Optional[str] = None
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    zip_code: str
    
    # Emergency Contact
    emergency_contact_name: str
    emergency_contact_relationship: str
    emergency_contact_phone: str
    
    # Primary Insurance
    insurance_provider_primary: Optional[str] = None
    insurance_policy_number_primary: Optional[str] = None
    insurance_group_number_primary: Optional[str] = None
    insurance_holder_name_primary: Optional[str] = None
    insurance_holder_dob_primary: Optional[str] = None
    insurance_relationship_primary: Optional[str] = None
    
    # Secondary Insurance
    insurance_provider_secondary: Optional[str] = None
    insurance_policy_number_secondary: Optional[str] = None
    insurance_group_number_secondary: Optional[str] = None
    
    # Medical History (as JSON strings)
    allergies: Optional[str] = None  # JSON array of AllergyItem
    current_medications: Optional[str] = None  # JSON array of MedicationItem
    past_surgeries: Optional[str] = None  # JSON array of SurgeryItem
    chronic_conditions: Optional[str] = None  # JSON array of ConditionItem
    family_medical_history: Optional[str] = None  # JSON array of FamilyHistoryItem
    primary_care_physician: Optional[str] = None
    
    # Social History
    tobacco_use: Optional[str] = "never"
    alcohol_use: Optional[str] = "never"
    exercise_frequency: Optional[str] = None
    occupation: Optional[str] = None
    
    # Review of Systems
    has_diabetes: bool = False
    has_hypertension: bool = False
    has_heart_disease: bool = False
    has_asthma: bool = False
    has_cancer: bool = False
    
    # Consent
    consent_to_treat: bool
    consent_privacy_policy: bool
    consent_financial_responsibility: bool
    signature: str
    
    is_complete: bool = True

class PatientIntakeUpdate(BaseModel):
    # All fields optional for partial updates
    ssn: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    preferred_language: Optional[str] = None
    race_ethnicity: Optional[str] = None
    phone_primary: Optional[str] = None
    phone_secondary: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    insurance_provider_primary: Optional[str] = None
    insurance_policy_number_primary: Optional[str] = None
    insurance_group_number_primary: Optional[str] = None
    insurance_holder_name_primary: Optional[str] = None
    insurance_holder_dob_primary: Optional[str] = None
    insurance_relationship_primary: Optional[str] = None
    insurance_provider_secondary: Optional[str] = None
    insurance_policy_number_secondary: Optional[str] = None
    insurance_group_number_secondary: Optional[str] = None
    allergies: Optional[str] = None
    current_medications: Optional[str] = None
    past_surgeries: Optional[str] = None
    chronic_conditions: Optional[str] = None
    family_medical_history: Optional[str] = None
    primary_care_physician: Optional[str] = None
    tobacco_use: Optional[str] = None
    alcohol_use: Optional[str] = None
    exercise_frequency: Optional[str] = None
    occupation: Optional[str] = None
    has_diabetes: Optional[bool] = None
    has_hypertension: Optional[bool] = None
    has_heart_disease: Optional[bool] = None
    has_asthma: Optional[bool] = None
    has_cancer: Optional[bool] = None
    consent_to_treat: Optional[bool] = None
    consent_privacy_policy: Optional[bool] = None
    consent_financial_responsibility: Optional[bool] = None
    signature: Optional[str] = None
    is_complete: Optional[bool] = None

class PatientIntakeResponse(BaseModel):
    id: int
    user_id: int
    
    # Personal Information
    ssn: Optional[str]
    date_of_birth: str
    gender: str
    marital_status: Optional[str]
    preferred_language: Optional[str]
    race_ethnicity: Optional[str]
    
    # Contact Information
    phone_primary: str
    phone_secondary: Optional[str]
    address_line1: str
    address_line2: Optional[str]
    city: str
    state: str
    zip_code: str
    
    # Emergency Contact
    emergency_contact_name: str
    emergency_contact_relationship: str
    emergency_contact_phone: str
    
    # Insurance
    insurance_provider_primary: Optional[str]
    insurance_policy_number_primary: Optional[str]
    insurance_group_number_primary: Optional[str]
    insurance_holder_name_primary: Optional[str]
    insurance_holder_dob_primary: Optional[str]
    insurance_relationship_primary: Optional[str]
    insurance_provider_secondary: Optional[str]
    insurance_policy_number_secondary: Optional[str]
    insurance_group_number_secondary: Optional[str]
    
    # Medical History
    allergies: Optional[str]
    current_medications: Optional[str]
    past_surgeries: Optional[str]
    chronic_conditions: Optional[str]
    family_medical_history: Optional[str]
    primary_care_physician: Optional[str]
    
    # Social History
    tobacco_use: Optional[str]
    alcohol_use: Optional[str]
    exercise_frequency: Optional[str]
    occupation: Optional[str]
    
    # Review of Systems
    has_diabetes: bool
    has_hypertension: bool
    has_heart_disease: bool
    has_asthma: bool
    has_cancer: bool
    
    # Consent
    consent_to_treat: bool
    consent_privacy_policy: bool
    consent_financial_responsibility: bool
    signature: Optional[str]
    
    # Administrative
    is_complete: bool
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True
