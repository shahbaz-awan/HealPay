"""
Seed script to populate database with test data for AI recommendation engine
Creates: patients, doctors, coders, clinical encounters, and code library
"""
import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.models import User, UserRole, ClinicalEncounter, CodeLibrary, Base
from app.core.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_users(db: Session):
    """Create test users if they don't exist"""
    print("Seeding users...")
    
    # Check if users already exist
    existing_doctor = db.query(User).filter(User.email == "doctor@healpay.com").first()
    if existing_doctor:
        print("  ✓ Doctor already exists")
        doctor = existing_doctor
    else:
        doctor = User(
            email="doctor@healpay.com",
            hashed_password=get_password_hash("doctor123"),
            role=UserRole.DOCTOR,
            first_name="John",
            last_name="Smith"
        )
        db.add(doctor)
        print("  ✓ Created doctor user")
    
    existing_patient = db.query(User).filter(User.email == "patient@healpay.com").first()
    if existing_patient:
        print("  ✓ Patient already exists")
        patient = existing_patient
    else:
        patient = User(
            email="patient@healpay.com",
            hashed_password=get_password_hash("patient123"),
            role=UserRole.PATIENT,
            first_name="Alice",
            last_name="Johnson"
        )
        db.add(patient)
        print("  ✓ Created patient user")
    
    existing_coder = db.query(User).filter(User.email == "coder@healpay.com").first()
    if existing_coder:
        print("  ✓ Coder already exists")
        coder = existing_coder
    else:
        coder = User(
            email="coder@healpay.com",
            hashed_password=get_password_hash("Coder@57"),
            role=UserRole.CODER,
            first_name="Sarah",
            last_name="Williams"
        )
        db.add(coder)
        print("  ✓ Created coder user")
    
    db.commit()
    db.refresh(doctor)
    db.refresh(patient)
    
    return doctor, patient, coder


def seed_clinical_encounters(db: Session, doctor: User, patient: User):
    """Create test clinical encounters with realistic SOAP notes"""
    print("\nSeeding clinical encounters...")
    
    encounters_data = [
        {
            "encounter_type": "Office Visit",
            "chief_complaint": "Persistent high blood pressure",
            "subjective_notes": "Patient reports elevated blood pressure readings at home (150/95) for the past 2 weeks. Experiencing occasional headaches and mild dizziness. No chest pain or shortness of breath. Patient has family history of hypertension.",
            "objective_findings": "BP: 152/96, HR: 78, Temp: 98.6°F. Alert and oriented x3. Cardiovascular exam shows regular rhythm, no murmurs. Neurological exam normal.",
            "assessment": "Essential (primary) hypertension. Patient blood pressure elevated above target range.",
            "plan": "Start lisinopril 10mg daily. Patient education on DASH diet. Recommend home BP monitoring twice daily. Follow-up in 2 weeks to assess response to medication."
        },
        {
            "encounter_type": "Follow-up Visit",
            "chief_complaint": "Type 2 diabetes management",
            "subjective_notes": "Patient with known Type 2 diabetes, reports blood glucose readings ranging 180-220 mg/dL despite metformin. Increased thirst and frequent urination. Compliant with current medication regimen. Diet adherence has been challenging.",
            "objective_findings": "Fasting glucose: 195 mg/dL. HbA1c: 8.2%. BMI: 31. Foot exam shows no neuropathy or ulcers. Retinal exam scheduled.",
            "assessment": "Type 2 diabetes mellitus without complications, poorly controlled. Need for medication adjustment.",
            "plan": "Increase metformin to 1000mg BID. Add glipizide 5mg daily. Referral to diabetes educator. Diabetic diet counseling. Recheck HbA1c in 3 months."
        },
        {
            "encounter_type": "Sick Visit",
            "chief_complaint": "Acute bronchitis symptoms",
            "subjective_notes": "Patient presents with productive cough for 5 days, green sputum, mild fever (100.5°F at home), and chest congestion. Denies shortness of breath at rest. Non-smoker. No recent travel.",
            "objective_findings": "Temp: 100.2°F, RR: 18, O2 sat: 97% on room air. Lung auscultation reveals scattered rhonchi in both lung fields, no wheezing. CXR: no consolidation.",
            "assessment": "Acute bronchitis, likely viral etiology. No evidence of pneumonia.",
            "plan": "Supportive care with rest and hydration. Guaifenesin for cough. Albuterol inhaler PRN if wheezing develops. Return if symptoms worsen or fever persists beyond 3 days."
        },
        {
            "encounter_type": "Annual Physical",
            "chief_complaint": "Annual wellness exam",
            "subjective_notes": "Patient here for routine annual physical. Generally feeling well. No new health concerns. Exercises 3x weekly. Non-smoker. Moderate alcohol use (1-2 drinks per week).",
            "objective_findings": "BP: 118/76, HR: 68, BMI: 24. Physical exam unremarkable. Labs: Total cholesterol 210, LDL 135, HDL 45, triglycerides 150. CBC normal.",
            "assessment": "Health maintenance visit. Borderline high cholesterol (dyslipidemia).",
            "plan": "Dietary counseling for cholesterol management. Increase fiber intake, reduce saturated fats. Recheck lipid panel in 6 months. Continue current exercise routine. All age-appropriate screenings up to date."
        },
        {
            "encounter_type": "Office Visit",
            "chief_complaint": "Lower back pain",
            "subjective_notes": "Patient reports acute onset of lower back pain 3 days ago after lifting heavy boxes. Pain rated 7/10, worse with movement and bending. No radiation to legs. No numbness or tingling. Taking ibuprofen with minimal relief.",
            "objective_findings": "Lumbar spine tender to palpation at L4-L5. Positive pain with flexion and extension. Straight leg raise negative bilaterally. Normal strength and reflexes in lower extremities. No saddle anesthesia.",
            "assessment": "Acute lumbar strain. Mechanical low back pain.",
            "plan": "NSAIDs (naproxen 500mg BID) with food. Muscle relaxant (cyclobenzaprine 5mg at bedtime PRN). Physical therapy referral. Ice/heat therapy. Avoid heavy lifting. Follow up in 2 weeks if not improving."
        }
    ]
    
    created_count = 0
    for idx, encounter_data in enumerate(encounters_data, 1):
        encounter = ClinicalEncounter(
            patient_id=patient.id,
            doctor_id=doctor.id,
            encounter_type=encounter_data["encounter_type"],
            chief_complaint=encounter_data["chief_complaint"],
            subjective_notes=encounter_data["subjective_notes"],
            objective_findings=encounter_data["objective_findings"],
            assessment=encounter_data["assessment"],
            plan=encounter_data["plan"],
            status="pending_coding",
            encounter_date=datetime.now() - timedelta(days=idx)
        )
        db.add(encounter)
        created_count += 1
    
    db.commit()
    print(f"  ✓ Created {created_count} clinical encounters")


def seed_code_library(db: Session):
    """Populate code library with common ICD-10 and CPT codes"""
    print("\nSeeding code library...")
    
    # Check if codes already exist
    existing_count = db.query(CodeLibrary).count()
    if existing_count > 0:
        print(f"  ℹ Code library already has {existing_count} codes, skipping...")
        return
    
    # Common ICD-10 codes
    icd_codes = [
        ("I10", "Essential (primary) hypertension", "Hypertension high blood pressure"),
        ("E11.9", "Type 2 diabetes mellitus without complications", "Diabetes type 2 hyperglycemia"),
        ("E11.65", "Type 2 diabetes mellitus with hyperglycemia", "Diabetes with high blood sugar"),
        ("J20.9", "Acute bronchitis, unspecified", "Bronchitis cough respiratory infection"),
        ("E78.5", "Hyperlipidemia, unspecified", "High cholesterol dyslipidemia"),
        ("M54.5", "Low back pain", "Lumbar pain backache"),
        ("R51", "Headache", "Head pain cephalalgia"),
        ("R42", "Dizziness and giddiness", "Vertigo lightheadedness"),
        ("Z00.00", "Encounter for general adult medical examination without abnormal findings", "Annual physical wellness exam"),
        ("J44.0", "Chronic obstructive pulmonary disease with acute lower respiratory infection", "COPD exacerbation"),
    ]
    
    # Common CPT codes
    cpt_codes = [
        ("99213", "Office visit, established patient, low-moderate complexity", "Office visit follow-up"),
        ("99214", "Office visit, established patient, moderate complexity", "Office visit established"),
        ("99203", "Office visit, new patient, low-moderate complexity", "New patient visit"),
        ("99204", "Office visit, new patient, moderate-high complexity", "New patient comprehensive"),
        ("99396", "Periodic comprehensive preventive medicine, established patient, 40-64 years", "Annual physical exam"),
        ("80053", "Comprehensive metabolic panel", "Blood test metabolic panel"),
        ("83036", "Hemoglobin A1c", "HbA1c diabetes test"),
        ("80061", "Lipid panel", "Cholesterol test"),
        ("71045", "Chest X-ray, single view", "CXR chest radiograph"),
        ("97110", "Therapeutic exercises", "Physical therapy exercise"),
    ]
    
    codes_added = 0
    
    # Add ICD-10 codes
    for code, short_desc, search_text in icd_codes:
        code_lib = CodeLibrary(
            code=code,
            code_type="ICD10_CM",
            short_description=short_desc,
            long_description=short_desc,
            search_text=f"{code} {short_desc} {search_text}",
            is_active=True,
            billable=True
        )
        db.add(code_lib)
        codes_added += 1
    
    # Add CPT codes
    for code, short_desc, search_text in cpt_codes:
        code_lib = CodeLibrary(
            code=code,
            code_type="CPT",
            short_description=short_desc,
            long_description=short_desc,
            search_text=f"{code} {short_desc} {search_text}",
            is_active=True,
            billable=True
        )
        db.add(code_lib)
        codes_added += 1
    
    db.commit()
    print(f"  ✓ Added {codes_added} medical codes to library")


def main():
    print("=" * 60)
    print("SEEDING TEST DATA FOR RECOMMENDATION ENGINE")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Step 1: Create users
        doctor, patient, coder = seed_users(db)
        
        # Step 2: Create clinical encounters
        seed_clinical_encounters(db, doctor, patient)
        
        # Step 3: Populate code library
        seed_code_library(db)
        
        print("\n" + "=" * 60)
        print("✅ DATABASE SEEDING COMPLETE!")
        print("=" * 60)
        print("\nTest Accounts:")
        print("  Doctor:  doctor@healpay.com  / doctor123")
        print("  Patient: patient@healpay.com / patient123")
        print("  Coder:   coder@healpay.com   / Coder@57")
        print("\nYou can now log in as the coder to test the recommendation engine!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
