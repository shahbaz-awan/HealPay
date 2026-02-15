"""Test if intake form actually saves to database"""
import requests
import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

print("Testing Intake Form Database Persistence (Backend Dir)")
print("="*60)

# Login as patient
try:
    r = requests.post(
        "http://localhost:8000/api/v1/auth/login",
        json={"email": "patient@healpay.com", "password": "patient123"}
    )
    
    if r.status_code != 200:
        print(f"Login failed: {r.status_code}")
        print(r.text)
        exit(1)
        
    token = r.json()['token']
    user_id = r.json()['user']['id']
    print(f"✓ Logged in as patient (ID: {user_id})")
    
except Exception as e:
    print(f"Connection error: {e}")
    exit(1)

# Delete existing intake if any
print("\n1. Cleaning up existing intake...")
r_del = requests.delete(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"   Delete status: {r_del.status_code}")

# Create new intake
print("\n2. Creating new intake...")
intake_data = {
    "date_of_birth": "1990-01-15",
    "gender": "Female",
    "phone_primary": "+1234567890",
    "address_line1": "456 Test Avenue",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "emergency_contact_name": "John Doe",
    "emergency_contact_relationship": "Spouse",
    "emergency_contact_phone": "+0987654321",
    "has_diabetes": False,
    "has_hypertension": False,
    "has_heart_disease": False,
    "has_asthma": False,
    "has_cancer": False,
    "consent_to_treat": True,
    "consent_privacy_policy": True,
    "consent_financial_responsibility": True,
    "signature": "Jane Doe",
    "is_complete": True
}

r_create = requests.post(
    "http://localhost:8000/api/v1/patient-intake/",
    headers={"Authorization": f"Bearer {token}"},
    json=intake_data
)

print(f"   Create status: {r_create.status_code}")

if r_create.status_code in [200, 201]:
    created = r_create.json()
    print(f"   ✓ Created intake ID: {created.get('id')}")
    intake_id = created.get('id')
else:
    print(f"   ✗ Failed: {r_create.text}")
    # Don't exit, still try to check DB to see if anything is there
    
# Wait a moment for DB commit
import time
time.sleep(1)

# Try to fetch it back via API
print("\n3. Fetching intake back from API...")
r_get = requests.get(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"   Get status: {r_get.status_code}")

if r_get.status_code == 200:
    fetched = r_get.json()
    print(f"   ✓ Found intake via API: ID {fetched.get('id')}")
else:
    print(f"   ✗ API could not find intake: {r_get.text}")

# Check with direct DB query
print("\n4. Direct database check...")
try:
    from app.db.database import SessionLocal
    from app.db.models import PatientIntake
    
    db = SessionLocal()
    try:
        intake_records = db.query(PatientIntake).filter(PatientIntake.user_id == user_id).all()
        print(f"   Found {len(intake_records)} intake record(s) for user {user_id}")
        
        if intake_records:
            for record in intake_records:
                print(f"   - Intake ID {record.id}: Complete={record.is_complete}, Signature={record.signature}")
            print("   ✓✓ DATA IS IN DATABASE!")
        else:
            print("   ✗ NO RECORDS IN DATABASE for this user!")
            
    finally:
        db.close()
        
except ImportError as e:
    print(f"   Import error: {e}")
    print("   Make sure running from healpay-backend directory")

print("\n" + "="*60)
