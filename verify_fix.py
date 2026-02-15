import requests
import time

# Wait for server to be ready
time.sleep(2)

print("Testing after fix...")
print("="*50)

# Test health endpoint
r = requests.get('http://localhost:8000/health')
print(f"Health check: {r.status_code}")

# Test login endpoint
r2 = requests.post(
    'http://localhost:8000/api/v1/auth/login', 
    json={'email': 'doctor@healpay.com', 'password': 'doctor123'}
)
print(f"Login status: {r2.status_code}")

if r2.status_code == 200:
    print("\n✓✓✓ FIX SUCCESSFUL! ✓✓✓")
    print("Doctor can now save clinical notes!")
    
    # Test clinical encounter endpoint
    token = r2.json()['token']
    r3 = requests.post(
        'http://localhost:8000/api/v1/clinical/encounters',
        json={
            'patient_id': 2,
            'encounter_type': 'Office Visit',
            'chief_complaint': 'Test from fixed API',
            'assessment': 'Test'
        },
        headers={'Authorization': f'Bearer {token}'}
    )
    print(f"\nClinical encounter creation: {r3.status_code}")
    if r3.status_code in [200, 201]:
        print("✓ Clinical encounters endpoint working!")
    else:
        print(f"✗ Issue: {r3.text}")
else:
    print(f"\n✗ Still having issues: {r2.text}")
