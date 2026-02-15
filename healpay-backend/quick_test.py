"""Direct test of the pending encounters endpoint"""
import requests

print("Testing pending encounters endpoint...")

# First login to get token
login_url = "http://localhost:8000/api/auth/login"
login_data = {"email": "coder@healpay.com", "password": "Coder@57"}

print("\n1. Logging in...")
response = requests.post(login_url, json=login_data)
print(f"   Login status: {response.status_code}")

if response.status_code == 200:
    token = response.json()["access_token"]
    print(f"   ✓ Got token")
    
    # Test the endpoint
    print("\n2. Testing endpoint: /api/v1/clinical/encounters/pending-coding")
    headers = {"Authorization": f"Bearer {token}"}
    enc_url = "http://localhost:8000/api/v1/clinical/encounters/pending-coding"
    
    enc_response = requests.get(enc_url, headers=headers)
    print(f"   Status: {enc_response.status_code}")
    
    if enc_response.status_code == 200:
        data = enc_response.json()
        print(f"   ✓ SUCCESS! Got {len(data)} encounters")
        if len(data) > 0:
            print(f"\n   First encounter:")
            print(f"   - ID: {data[0]['id']}")
            print(f"   - Patient: {data[0]['patient_name']}")
            print(f"   - Chief Complaint: {data[0]['chief_complaint']}")
    else:
        print(f"   ✗ FAILED")
        print(f"   Response: {enc_response.text[:500]}")
else:
    print(f"   ✗ Login failed: {response.text}")
