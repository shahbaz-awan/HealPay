from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    CODER = "CODER"
    BILLING = "BILLING"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    first_name = Column(String)
    last_name = Column(String)
    phone = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<User {self.email} - {self.role}>"

class PatientIntake(Base):
    __tablename__ = "patient_intakes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Personal Information
    ssn = Column(String, nullable=True)  # Last 4 digits only for security
    date_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=False)
    marital_status = Column(String, nullable=True)
    preferred_language = Column(String, nullable=True)
    race_ethnicity = Column(String, nullable=True)
    
    # Contact Information
    phone_primary = Column(String, nullable=False)
    phone_secondary = Column(String, nullable=True)
    address_line1 = Column(String, nullable=False)
    address_line2 = Column(String, nullable=True)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    zip_code = Column(String, nullable=False)
    
    # Emergency Contact
    emergency_contact_name = Column(String, nullable=False)
    emergency_contact_relationship = Column(String, nullable=False)
    emergency_contact_phone = Column(String, nullable=False)
    
    # Primary Insurance
    insurance_provider_primary = Column(String, nullable=True)
    insurance_policy_number_primary = Column(String, nullable=True)
    insurance_group_number_primary = Column(String, nullable=True)
    insurance_holder_name_primary = Column(String, nullable=True)
    insurance_holder_dob_primary = Column(String, nullable=True)
    insurance_relationship_primary = Column(String, nullable=True)
    
    # Secondary Insurance (Optional)
    insurance_provider_secondary = Column(String, nullable=True)
    insurance_policy_number_secondary = Column(String, nullable=True)
    insurance_group_number_secondary = Column(String, nullable=True)
    
    # Medical History
    primary_care_physician = Column(String, nullable=True)
    allergies = Column(String, nullable=True)  # JSON string
    current_medications = Column(String, nullable=True)  # JSON string
    past_surgeries = Column(String, nullable=True)  # JSON string
    chronic_conditions = Column(String, nullable=True)  # JSON string
    family_medical_history = Column(String, nullable=True)  # JSON string
    
    # Social History
    tobacco_use = Column(String, nullable=True)  # never, former, current
    alcohol_use = Column(String, nullable=True)  # never, occasional, regular
    exercise_frequency = Column(String, nullable=True)
    occupation = Column(String, nullable=True)
    
    # Review of Systems (Yes/No for common conditions)
    has_diabetes = Column(Boolean, default=False)
    has_hypertension = Column(Boolean, default=False)
    has_heart_disease = Column(Boolean, default=False)
    has_asthma = Column(Boolean, default=False)
    has_cancer = Column(Boolean, default=False)
    
    # Consent & Legal
    consent_to_treat = Column(Boolean, default=False)
    consent_privacy_policy = Column(Boolean, default=False)
    consent_financial_responsibility = Column(Boolean, default=False)
    signature = Column(String, nullable=True)  # Digital signature or name
    
    # Administrative
    is_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<PatientIntake user_id={self.user_id}>"


# Clinical Encounters - When doctor sees a patient
class ClinicalEncounter(Base):
    __tablename__ = "clinical_encounters"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Encounter details
    encounter_date = Column(DateTime(timezone=True), server_default=func.now())
    encounter_type = Column(String, nullable=False)  # "Office Visit", "Follow-up"
    chief_complaint = Column(String, nullable=False)  # Main reason for visit
    
    # Clinical notes (SOAP format)
    subjective_notes = Column(Text, nullable=True)  # Patient's description
    objective_findings = Column(Text, nullable=True)  # Doctor's observations
    assessment = Column(Text, nullable=True)  # Diagnosis
    plan = Column(Text, nullable=True)  # Treatment plan
    
    # Status
    status = Column(String, default="pending_coding")  # pending_coding, coded, billed
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<ClinicalEncounter id={self.id}>"


# Medical Codes assigned by coders
class MedicalCode(Base):
    __tablename__ = "medical_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("clinical_encounters.id"), nullable=False)
    coder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    code_type = Column(String, nullable=False)  # "ICD-10" or "CPT"
    code = Column(String, nullable=False)  # e.g., "E11.9", "99213"
    description = Column(String, nullable=False)
    
    is_ai_suggested = Column(Boolean, default=False)
    confidence_score = Column(Float, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<MedicalCode {self.code}>"


# Insurance Claims
class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(Integer, primary_key=True, index=True)
    encounter_id = Column(Integer, ForeignKey("clinical_encounters.id"), nullable=False)
    
    claim_number = Column(String, unique=True, nullable=False)
    insurance_provider = Column(String, nullable=False)
    total_amount = Column(Float, nullable=False)
    patient_responsibility = Column(Float, nullable=True)
    
    status = Column(String, default="submitted")  # submitted, approved, denied, paid
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Claim {self.claim_number}>"

class Appointment(Base):
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Patient
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Doctor
    
    appointment_date = Column(String, nullable=False)  # Date in YYYY-MM-DD format
    appointment_time = Column(String, nullable=False)  # Time like "10:30 AM"
    appointment_type = Column(String, nullable=False)  # General Consultation, Follow-up, etc.
    reason = Column(Text, nullable=True)  # Optional reason/notes
    patient_dob = Column(String, nullable=True)  # DOB from intake form
    
    status = Column(String, default="scheduled")  # scheduled, completed, cancelled, no-show
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Appointment {self.id} - Patient:{self.user_id} Doctor:{self.doctor_id} on {self.appointment_date}>"


# Code Library for AI-powered medical code recommendations
class CodeLibrary(Base):
    __tablename__ = "code_library"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, index=True)  # e.g., "I10", "99213"
    code_type = Column(String, nullable=False, index=True)  # "ICD10_CM", "CPT", "HCPCS"
    short_description = Column(String, nullable=False)
    long_description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    # Searchable text combining code and descriptions for embedding/matching
    search_text = Column(Text, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    billable = Column(Boolean, default=True, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<CodeLibrary {self.code}: {self.short_description}>"

# Invoices for Patients
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Link to claim if applicable, or just specific encounter
    claim_id = Column(Integer, ForeignKey("claims.id"), nullable=True)
    encounter_id = Column(Integer, ForeignKey("clinical_encounters.id"), nullable=True)
    
    invoice_number = Column(String, unique=True, nullable=False)
    issue_date = Column(String, nullable=False)  # YYYY-MM-DD
    due_date = Column(String, nullable=False)    # YYYY-MM-DD
    
    total_amount = Column(Float, nullable=False)
    amount_paid = Column(Float, default=0.0)
    balance_due = Column(Float, nullable=False)
    
    status = Column(String, default="issued")  # issued, paid, overdue, cancelled
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<Invoice {self.invoice_number}>"


# Payments tracked
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    
    amount = Column(Float, nullable=False)
    payment_date = Column(DateTime(timezone=True), server_default=func.now())
    payment_method = Column(String, nullable=False)  # Credit Card, Cash, Insurance, Bank Transfer
    transaction_id = Column(String, nullable=True)
    
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<Payment {self.id} - {self.amount}>"
