"""Test database contents and recommendation system"""
from app.db.database import SessionLocal
from app.db.models import ClinicalEncounter, User, CodeLibrary, MedicalCode
from sqlalchemy import func

db = SessionLocal()

print("="*70)
print("DATABASE CONTENTS CHECK")
print("="*70)

try:
    # Count all tables
    user_count = db.query(User).count()
    encounter_count = db.query(ClinicalEncounter).count()
    code_library_count = db.query(CodeLibrary).count()
    medical_code_count = db.query(MedicalCode).count()
    
    print(f"\nTable Counts:")
    print(f"  Users: {user_count}")
    print(f"  Clinical Encounters: {encounter_count}")
    print(f"  Code Library (ICD/CPT): {code_library_count}")
    print(f"  Assigned Medical Codes: {medical_code_count}")
    
    # Show encounters
    print(f"\n{'='*70}")
    print("CLINICAL ENCOUNTERS")
    print("="*70)
    
    encounters = db.query(ClinicalEncounter).limit(10).all()
    if encounters:
        for e in encounters:
            print(f"\nEncounter ID: {e.id}")
            print(f"  Patient ID: {e.patient_id}")
            print(f"  Doctor ID: {e.doctor_id}")
            print(f"  Type: {e.encounter_type}")
            print(f"  Status: {e.status}")
            print(f"  Complaint: {e.chief_complaint[:50] if e.chief_complaint else 'N/A'}...")
            print(f"  Date: {e.encounter_date}")
    else:
        print("\n⚠ No encounters found in database!")
        print("   The coder dashboard is showing dummy/mock data.")
    
    # Show code library status
    print(f"\n{'='*70}")
    print("CODE LIBRARY STATUS")
    print("="*70)
    
    if code_library_count > 0:
        icd_count = db.query(CodeLibrary).filter(
            CodeLibrary.code_type == 'ICD10_CM'
        ).count()
        cpt_count = db.query(CodeLibrary).filter(
            CodeLibrary.code_type == 'CPT'
        ).count()
        
        print(f"  ICD-10 codes: {icd_count}")
        print(f"  CPT codes: {cpt_count}")
        print(f"  Total: {code_library_count}")
        print("\n✓ Code library is populated - AI recommendations SHOULD work")
        
        # Show sample codes
        print("\nSample ICD-10 codes:")
        sample_icd = db.query(CodeLibrary).filter(
            CodeLibrary.code_type == 'ICD10_CM'
        ).limit(3).all()
        for code in sample_icd:
            print(f"  {code.code}: {code.short_description[:60]}")
            
        print("\nSample CPT codes:")
        sample_cpt = db.query(CodeLibrary).filter(
            CodeLibrary.code_type == 'CPT'
        ).limit(3).all()
        for code in sample_cpt:
            print(f"  {code.code}: {code.short_description[:60]}")
    else:
        print("\n✗ CODE LIBRARY IS EMPTY!")
        print("   This is why AI recommendations are not working.")
        print("   Need to seed the code library with ICD-10 and CPT codes.")
    
    print(f"\n{'='*70}")
    print("DIAGNOSIS")
    print("="*70)
    
    if encounter_count == 0:
        print("\n❌ Issue 1: NO ENCOUNTERS IN DATABASE")
        print("   - Coder dashboard is using dummy/mock data")
        print("   - Doctors need to create clinical encounters")
        print("   - Or database needs to be seeded with test encounters")
    else:
        print(f"\n✓ Database has {encounter_count} encounter(s)")
    
    if code_library_count == 0:
        print("\n❌ Issue 2: CODE LIBRARY IS EMPTY")
        print("   - AI recommendation engine cannot work without codes")
        print("   - Need to import ICD-10 and CPT code databases")
        print("   - This is why recommendations are failing")
    else:
        print(f"\n✓ Code library has {code_library_count} codes")
    
finally:
    db.close()
