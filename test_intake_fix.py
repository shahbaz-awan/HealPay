"""Quick test of patient intake form submission"""
import requests

print("Testing Patient Intake Form Fix")
print("="*50)

# Login as patient Farooq (newly registered)
r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "farooq@healpay.com", "password": "Farooq@123"}
)

if r.status_code != 200:
    print(f"❌ Login failed: {r.status_code}")
    exit(1)

token = r.json()['token']
print("✅ Patient login successful")

# Test 1: Check if intake exists
print("\n1. Checking existing intake...")
r2 = requests.get(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)

if r2.status_code == 404:
    print("ℹ️  No existing intake (expected for new patient)")
elif r2.status_code == 200:
    print("✅ Found existing intake")
else:
    print(f"❌ Unexpected status: {r2.status_code}")

# Test 2: Submit new intake
print("\n2. Submitting new intake form...")
intake_data = {
    "date_of_birth": "1995-06-15",
    "gender": "Male",
    "ssn": "1234",
    "phone_primary": "+923432580279",
    "address_line1": "123 Main Street",
    "city": "Lahore",
    "state": "NY",
    "zip_code": "10001",
    "emergency_contact_name": "Emergency Contact",
    "emergency_contact_relationship": "Brother",
    "emergency_contact_phone": "+9234567890",
    "has_diabetes": False,
    "has_hypertension": False,
    "has_heart_disease": False,
    "has_asthma": False,
    "has_cancer": False,
    "consent_to_treat": True,
    "consent_privacy_policy": True,
    "consent_financial_responsibility": True,
    "signature": "Farooq Jamal Khan",
    "is_complete": True
}

r3 = requests.post(
    "http://localhost:8000/api/v1/patient-intake/",
    headers={"Authorization": f"Bearer {token}"},
    json=intake_data
)

print(f"Status: {r3.status_code}")

if r3.status_code in [200, 201]:
    print("✅ Intake form submitted successfully!")
    data = r3.json()
    print(f"   Intake ID: {data.get('id')}")
    print(f"   User ID: {data.get('user_id')}")
    print(f"   Complete: {data.get('is_complete')}")
elif r3.status_code == 400:
    print(f"❌ Validation error:")
    print(f"   {r3.json()}")
elif r3.status_code == 409:
    print("ℹ️  Intake already exists (updating instead)")
else:
    print(f"❌ Error {r3.status_code}: {r3.text[:200]}")

print("\n" + "="*50)
if r3.status_code in [200, 201]:
    print("✅ PATIENT INTAKE FORM IS NOW WORKING!")
else:
    print("❌ Issue detected - check error above")
