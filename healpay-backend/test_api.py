"""
Test the pending encounters API endpoint directly
"""
import requests
import json

# First, get a token by logging in as coder
print("=" * 60)
print("TESTING PENDING ENCOUNTERS API")
print("=" * 60)

# Login
login_url = "http://localhost:8000/api/auth/login"
login_data = {
    "email": "coder@healpay.com",
    "password": "Coder@57"
}

print("\n1. Logging in as coder...")
try:
    response = requests.post(login_url, json=login_data)
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        token = data.get("access_token")
        print(f"   ✓ Got access token: {token[:50]}...")
        
        # Try to get pending encounters
        print("\n2. Fetching pending encounters...")
        encounters_url = "http://localhost:8000/api/v1/clinical/encounters/pending-coding"
        headers = {"Authorization": f"Bearer {token}"}
        
        enc_response = requests.get(encounters_url, headers=headers)
        print(f"   Status: {enc_response.status_code}")
        
        if enc_response.status_code == 200:
            encounters = enc_response.json()
            print(f"   ✓ Got {len(encounters)} encounters")
            
            if len(encounters) > 0:
                print("\n   First encounter:")
                first = encounters[0]
                print(f"   - ID: {first.get('id')}")
                print(f"   - Patient: {first.get('patient_name')}")
                print(f"   - Chief Complaint: {first.get('chief_complaint')}")
                print(f"   - Status: {first.get('status')}")
            else:
                print("   ⚠ Response is empty list!")
        else:
            print(f"   ✗ Error: {enc_response.text}")
    else:
        print(f"   ✗ Login failed: {response.text}")
        
except Exception as e:
    print(f"   ✗ Error: {e}")

print("\n" + "=" * 60)
