"""
Quick test for clinical encounters endpoint
"""
import requests

BASE_URL = "http://localhost:8000"

# Login as doctor
print("Logging in as doctor...")
login_response = requests.post(
    f"{BASE_URL}/api/v1/auth/login",
    json={"email": "doctor@healpay.com", "password": "doctor123"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.status_code}")
    print(login_response.text)
    exit(1)

token = login_response.json()["access_token"]
print("✓ Logged in successfully")

# Try to create a clinical encounter
print("\nCreating clinical encounter...")
encounter_data = {
    "patient_id": 2,  # Assuming patient ID 2 exists
    "encounter_type": "Office Visit",
    "chief_complaint": "Test complaint",
    "subjective_notes": "Patient reports test symptoms",
    "objective_findings": "Test findings",
    "assessment": "Test assessment",
    "plan": "Test plan"
}

create_response = requests.post(
    f"{BASE_URL}/api/v1/clinical/encounters",
    headers={"Authorization": f"Bearer {token}"},
    json=encounter_data
)

print(f"Status Code: {create_response.status_code}")
print(f"Response: {create_response.text}")

if create_response.status_code == 200 or create_response.status_code == 201:
    print("✓ Clinical encounter created successfully!")
else:
    print(f"❌ Failed to create encounter")
