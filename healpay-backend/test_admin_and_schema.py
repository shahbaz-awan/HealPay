"""Test admin dashboard APIs and database relationships"""
import requests
from app.db.database import SessionLocal
from app.db.models import User, ClinicalEncounter, PatientIntake
from sqlalchemy import inspect

print("="*70)
print("ADMIN DASHBOARD & SCHEMA TESTING")
print("="*70)

# 1. Test Admin Login and User List API
print("\n1. Testing Admin API - Get All Users")
print("-" * 70)

login_r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@healpay.com", "password": "admin123"}
)

if login_r.status_code == 200:
    token = login_r.json()['token']
    print("✓ Admin login successful")
    
    # Get all users
    users_r = requests.get(
        "http://localhost:8000/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    print(f"Status: {users_r.status_code}")
    
    if users_r.status_code == 200:
        users = users_r.json()
        print(f"✓ API returned {len(users)} users")
        
        print("\nRegistered Users:")
        for u in users:
            print(f"  {u.get('id', 'N/A'):2} | {u.get('email', 'N/A'):30} | {u.get('role', 'N/A'):10} | {u.get('first_name', '')} {u.get('last_name', '')}")
    else:
        print(f"✗ Failed to get users: {users_r.status_code}")
        print(f"  Error: {users_r.text[:200]}")
else:
    print(f"✗ Admin login failed: {login_r.status_code}")
    print(f"  Error: {login_r.text[:200]}")

# 2. Check Database Relationships
print("\n2. Checking Database Schema & Relationships")
print("-" * 70)

db = SessionLocal()

try:
    # Check Users table
    users = db.query(User).all()
    print(f"\nUsers in Database: {len(users)}")
    
    roles_count = {}
    for u in users:
        role = u.role.value
        roles_count[role] = roles_count.get(role, 0) + 1
    
    print("User Distribution by Role:")
    for role, count in sorted(roles_count.items()):
        print(f"  {role}: {count}")
    
    # Check ClinicalEncounters and relationships
    encounters = db.query(ClinicalEncounter).all()
    print(f"\nClinical Encounters: {len(encounters)}")
    
    # Check if relationships work
    print("\nTesting Patient → Doctor → Coder Workflow:")
    print("-" * 70)
    
    if encounters:
        sample_encounter = encounters[0]
        print(f"\nSample Encounter ID: {sample_encounter.id}")
        print(f"  Patient ID: {sample_encounter.patient_id}")
        print(f"  Doctor ID: {sample_encounter.doctor_id}")
        print(f"  Status: {sample_encounter.status}")
        
        # Try to get patient details
        patient = db.query(User).filter(User.id == sample_encounter.patient_id).first()
        doctor = db.query(User).filter(User.id == sample_encounter.doctor_id).first()
        
        if patient:
            print(f"  Patient: {patient.first_name} {patient.last_name} ({patient.email})")
        else:
            print(f"  ✗ Patient not found! (ID: {sample_encounter.patient_id})")
        
        if doctor:
            print(f"  Doctor: {doctor.first_name} {doctor.last_name} ({doctor.email})")
        else:
            print(f"  ✗ Doctor not found! (ID: {sample_encounter.doctor_id})")
        
        # Check foreign key constraints
        inspector = inspect(db.bind)
        fk_constraints = inspector.get_foreign_keys('clinical_encounters')
        
        print("\n  Foreign Key Constraints:")
        for fk in fk_constraints:
            print(f"    {fk['constrained_columns']} → {fk['referred_table']}.{fk['referred_columns']}")
    
    # Check PatientIntake relationship
    print("\n3. Checking Patient Intake Data")
    print("-" * 70)
    
    intakes = db.query(PatientIntake).all()
    print(f"Patient Intakes: {len(intakes)}")
    
    if intakes:
        sample_intake = intakes[0]
        patient = db.query(User).filter(User.id == sample_intake.user_id).first()
        
        if patient:
            print(f"  Sample: Patient {patient.email} has intake data")
        else:
            print(f"  ✗ Orphaned intake! User ID {sample_intake.user_id} not found")
    
    # Summary
    print("\n" + "="*70)
    print("WORKFLOW VALIDATION")
    print("="*70)
    
    # Get counts by role
    patients = db.query(User).filter(User.role == 'PATIENT').count()
    doctors = db.query(User).filter(User.role == 'DOCTOR').count()
    coders = db.query(User).filter(User.role == 'CODER').count()
    
    print(f"\nWorkflow Components:")
    print(f"  Patients: {patients}")
    print(f"  Doctors: {doctors}")
    print(f"  Coders: {coders}")
    print(f"  Encounters: {len(encounters)}")
    
    # Check workflow integrity
    issues = []
    
    if patients == 0:
        issues.append("No patients in database")
    if doctors == 0:
        issues.append("No doctors in database")
    if coders == 0:
        issues.append("No coders in database")
    
    # Check for orphaned encounters
    for enc in encounters:
        patient_exists = db.query(User).filter(User.id == enc.patient_id).first()
        doctor_exists = db.query(User).filter(User.id == enc.doctor_id).first()
        
        if not patient_exists:
            issues.append(f"Encounter {enc.id} references missing patient ID {enc.patient_id}")
        if not doctor_exists:
            issues.append(f"Encounter {enc.id} references missing doctor ID {enc.doctor_id}")
    
    if issues:
        print("\n❌ SCHEMA ISSUES FOUND:")
        for issue in issues:
            print(f"  • {issue}")
    else:
        print("\n✅ Schema integrity: OK")
        print("   All relationships are valid")

finally:
    db.close()
