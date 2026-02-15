"""Test if intake form actually saves to database"""
import requests

print("Testing Intake Form Database Persistence")
print("="*60)

# Login as patient
r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "patient@healpay.com", "password": "patient123"}
)

if r.status_code != 200:
    print(f"Login failed: {r.status_code}")
    exit(1)

token = r.json()['token']
user_id = r.json()['user']['id']
print(f"✓ Logged in as patient (ID: {user_id})")

# Delete existing intake if any
print("\n1. Cleaning up existing intake...")
r_del = requests.delete(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)
print(f"   Delete status: {r_del.status_code} (404 is OK if none exists)")

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
    print(f"   ✗ Failed: {r_create.text[:300]}")
    exit(1)

# Wait a moment for DB commit
import time
time.sleep(0.5)

# Try to fetch it back
print("\n3. Fetching intake back from database...")
r_get = requests.get(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"   Get status: {r_get.status_code}")

if r_get.status_code == 200:
    fetched = r_get.json()
    print(f"   ✓ Found intake ID: {fetched.get('id')}")
    print(f"   ✓ User ID: {fetched.get('user_id')}")
    print(f"   ✓ Complete: {fetched.get('is_complete')}")
    print(f"   ✓ Signature: {fetched.get('signature')}")
    
    # Verify data matches
    if fetched.get('user_id') == user_id:
        print(f"\n   ✓✓ USER ID MATCHES - data is persisted correctly!")
    else:
        print(f"\n   ✗✗ USER ID MISMATCH - expected {user_id}, got {fetched.get('user_id')}")
        
elif r_get.status_code == 404:
    print("   ✗✗ INTAKE NOT FOUND - DATA DID NOT PERSIST!")
    print("\n   This means the create succeeded but didn't save to DB")
    print("   Likely issue: missing db.commit() in backend")
else:
    print(f"   ✗ Unexpected error: {r_get.text[:300]}")

# Check with direct DB query
print("\n4. Direct database check...")
from app.db.database import SessionLocal
from app.db.models import PatientIntake

db = SessionLocal()
try:
    intake_records = db.query(PatientIntake).filter(PatientIntake.user_id == user_id).all()
    print(f"   Found {len(intake_records)} intake record(s) for user {user_id}")
    
    if intake_records:
        for record in intake_records:
            print(f"   - Intake ID {record.id}: Complete={record.is_complete}, Signature={record.signature}")
    else:
        print("   ✗ NO RECORDS IN DATABASE for this user!")
        
    # Check all intakes
    all_intakes = db.query(PatientIntake).all()
    print(f"\n   Total intakes in database: {len(all_intakes)}")
    
finally:
    db.close()

print("\n" + "="*60)
print("DIAGNOSIS:")
if r_get.status_code == 200:
    print("✓ Everything works - intake is being saved correctly")
else:
    print("✗ ISSUE CONFIRMED: Intake not persisting to database")
    print("  Backend endpoint needs db.commit() added")
