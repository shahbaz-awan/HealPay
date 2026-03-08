from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum, Index, JSON
from sqlalchemy.orm import relationship
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
    specialization = Column(String, nullable=True)  # e.g. Cardiology, General Practice
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=True, nullable=False)

    # US Medical Billing — provider identity fields
    npi_number = Column(String(10), nullable=True)       # National Provider Identifier
    taxonomy_code = Column(String(10), nullable=True)    # Provider specialty taxonomy
    license_number = Column(String, nullable=True)       # State license number
    license_state = Column(String(2), nullable=True)     # Two-letter state code

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    patient_intake = relationship("PatientIntake", back_populates="user", uselist=False)
    sent_notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

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

    # Relationships
    user = relationship("User", back_populates="patient_intake")

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
    status = Column(String, default="pending_coding")
    # Valid values: pending_coding, coded, sent_to_biller, sent_to_doctor,
    #               claim_submitted, billed

    # US Billing context fields
    place_of_service_code = Column(String(2), nullable=True, default="11")  # 11=Office, 21=Inpatient
    referring_provider_npi = Column(String(10), nullable=True)
    facility_npi = Column(String(10), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    medical_codes = relationship("MedicalCode", back_populates="encounter", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="encounter")
    invoices = relationship("Invoice", back_populates="encounter")

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

    # CMS-1500 Box 24 service-line fields
    modifier_1 = Column(String(2), nullable=True)   # e.g. "25", "59", "GT"
    modifier_2 = Column(String(2), nullable=True)
    units = Column(Integer, default=1, nullable=False)
    charge_amount = Column(Float, nullable=True)    # Fee charged per line
    diagnosis_pointers = Column(String(8), nullable=True)  # e.g. "A" or "AB" (Box 24E)
    place_of_service_code = Column(String(2), nullable=True, default="11")

    is_ai_suggested = Column(Boolean, default=False)
    confidence_score = Column(Float, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    encounter = relationship("ClinicalEncounter", back_populates="medical_codes")

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

    # Claim metadata for US billing
    claim_type = Column(String, default="original")  # original, corrected, void
    billing_provider_npi = Column(String(10), nullable=True)
    rendering_provider_npi = Column(String(10), nullable=True)
    denial_reason_code = Column(String(10), nullable=True)  # CARC code e.g. "CO-4"
    adjudication_date = Column(DateTime(timezone=True), nullable=True)
    payer_control_number = Column(String, nullable=True)    # ICN from insurer

    # Full CMS-1500 form data snapshot (JSON)
    cms1500_data = Column(JSON, nullable=True)

    status = Column(String, default="submitted")  # submitted, approved, denied, paid
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    encounter = relationship("ClinicalEncounter", back_populates="claims")
    invoices = relationship("Invoice", back_populates="claim")

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
    adjustment_amount = Column(Float, default=0.0)  # Contractual write-off
    notes = Column(Text, nullable=True)

    status = Column(String, default="issued")  # issued, paid, overdue, cancelled

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    encounter = relationship("ClinicalEncounter", back_populates="invoices")
    claim = relationship("Claim", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

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

    # US billing payment detail
    payer_type = Column(String, default="patient")   # patient, primary_insurance, secondary_insurance
    check_number = Column(String, nullable=True)      # Check or EFT number from insurer
    posting_date = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")

    def __repr__(self):
        return f"<Payment {self.id} - {self.amount}>"


# Database-backed OTP storage (replaces in-memory dict)
class OtpVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    purpose = Column(String, nullable=False, default="signup")  # signup | password_reset
    # Stores serialized user registration data for signup OTP
    user_data = Column(Text, nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<OtpVerification {self.email} purpose={self.purpose}>"


# Notifications
class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="info")  # info | success | warning | error
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)   # optional frontend route

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="sent_notifications")

    def __repr__(self):
        return f"<Notification {self.id} user={self.user_id}>"


# ─── Performance indexes ──────────────────────────────────────────────────
Index("ix_clinical_encounter_status",   ClinicalEncounter.__table__.c.status)
Index("ix_invoice_status",              Invoice.__table__.c.status)
Index("ix_invoice_patient_id",          Invoice.__table__.c.patient_id)
Index("ix_appointment_user_id",         Appointment.__table__.c.user_id)
Index("ix_appointment_status",          Appointment.__table__.c.status)
Index("ix_medical_code_encounter_id",   MedicalCode.__table__.c.encounter_id)
Index("ix_notification_user_unread",    Notification.__table__.c.user_id, Notification.__table__.c.is_read)


# ─── HIPAA Audit Log ─────────────────────────────────────────────────────────
class AuditLog(Base):
    """
    Records every sensitive data access/mutation for HIPAA compliance.
    (§164.312 — Access Control & Audit Controls)
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for unauthenticated
    user_email = Column(String, nullable=True)   # Denormalised for fast reporting
    action = Column(String, nullable=False)      # CREATE, READ, UPDATE, DELETE
    resource_type = Column(String, nullable=False)  # e.g. PatientIntake, ClinicalEncounter
    resource_id = Column(Integer, nullable=True)
    ip_address = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    status_code = Column(Integer, nullable=True) # HTTP response code
    detail = Column(Text, nullable=True)         # Optional context/error message
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} {self.resource_type}/{self.resource_id} by {self.user_email}>"

Index("ix_audit_log_user",      AuditLog.__table__.c.user_id)
Index("ix_audit_log_resource",  AuditLog.__table__.c.resource_type, AuditLog.__table__.c.resource_id)
Index("ix_audit_log_timestamp", AuditLog.__table__.c.timestamp)
