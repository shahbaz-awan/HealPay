"""Test patient intake endpoint"""
import requests

# Login as patient
print("Testing Patient Intake API")
print("="*50)

r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "patient@healpay.com", "password": "patient123"}
)

if r.status_code != 200:
    print(f"Login failed: {r.status_code}")
    print(r.text)
    exit(1)

token = r.json()['token']
print("✓ Patient login successful")

# Try to get existing intake
print("\n1. Testing GET /my-intake")
r2 = requests.get(
    "http://localhost:8000/api/v1/patient-intake/my-intake",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    print("✓ Has existing intake")
    print(f"Data: {r2.json()}")
elif r2.status_code == 404:
    print("ℹ No intake form yet (expected for new patient)")
else:
    print(f"Error: {r2.text[:200]}")

# Try to create intake
print("\n2. Testing POST / (create intake)")
test_data = {
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "phone_primary": "+1234567890",
    "address_line_1": "123 Test St",
    "city": "Test City",
    "state": "NY",
    "zip_code": "10001",
    "emergency_contact_name": "Test Emergency",
    "emergency_contact_relationship": "Friend",
    "emergency_contact_phone": "+0987654321",
    "has_diabetes": False,
    "has_hypertension": False,
    "has_heart_disease": False,
    "has_asthma": False,
    "has_cancer": False,
    "consent_to_treat": True,
    "consent_privacy_policy": True,
    "consent_financial_responsibility": True,
    "signature": "Test Patient"
}

r3 = requests.post(
    "http://localhost:8000/api/v1/patient-intake/",
    headers={"Authorization": f"Bearer {token}"},
    json=test_data
)

print(f"Status: {r3.status_code}")
if r3.status_code in [200, 201]:
    print("✓ Intake created successfully")
elif r3.status_code == 400:
    print(f"Validation error: {r3.text[:500]}")
else:
    print(f"Error: {r3.text[:500]}")

print("\n" + "="*50)
print("DIAGNOSIS:")
if r3.status_code == 404:
    print("❌ Endpoint not found - backend issue")
elif r3.status_code in [400, 422]:
    print("⚠ Validation error - check field names/types")
elif r3.status_code in [200, 201]:
    print("✅ API works - issue might be in frontend data format")
