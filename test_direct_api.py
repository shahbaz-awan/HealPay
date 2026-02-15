"""
Direct test of auth login endpoint
"""
import requests
import json

print("Testing auth login endpoint...")
print("URL: http://localhost:8000/api/v1/auth/login")

response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "doctor@healpay.com", "password": "doctor123"},
    headers={"Content-Type": "application/json"}
)

print(f"\nStatus: {response.status_code}")
print(f"Response: {response.text[:500]}")

if response.status_code == 200:
    data = response.json()
    print("\n✓ Login successful!")
    print(f"Token: {data.get('token', '')[:50]}...")
    
    # Now test creating clinical encounter
    print("\n\nTesting create clinical encounter...")
    enc_response = requests.post(
        "http://localhost:8000/api/v1/clinical/encounters",
        json={
            "patient_id": 2,
            "encounter_type": "Office Visit",
            "chief_complaint": "Test complaint from API",
            "assessment": "Test assessment",
            "subjective_notes": "Test subjective",
            "objective_findings": "Test objective",
            "plan": "Test plan"
        },
        headers={
            "Authorization": f"Bearer {data['token']}",
            "Content-Type": "application/json"
        }
    )
    
    print(f"Status: {enc_response.status_code}")
    print(f"Response: {enc_response.text}")
