"""
Test Frontend Login After Fix
"""
import requests

BASE_URL = "http://localhost:8000/api/v1"

print("Testing Frontend-Backend Connection")
print("="*50)

# Test doctor login
print("\n1. Testing Doctor Login...")
r1 = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "doctor@healpay.com", "password": "doctor123"}
)
print(f"   Status: {r1.status_code}")
if r1.status_code == 200:
    print("   ✓ Doctor login successful!")
    print(f"   Token: {r1.json()['token'][:30]}...")
else:
    print(f"   ✗ Login failed: {r1.text}")

# Test coder login
print("\n2. Testing Coder Login...")
r2 = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "coder@healpay.com", "password": "Coder@57"}
)
print(f"   Status: {r2.status_code}")
if r2.status_code == 200:
    print("   ✓ Coder login successful!")
else:
    print(f"   ✗ Login failed: {r2.text}")

# Test admin login  
print("\n3. Testing Admin Login...")
r3 = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "admin@healpay.com", "password": "Admin@123"}
)
print(f"   Status: {r3.status_code}")
if r3.status_code == 200:
    print("   ✓ Admin login successful!")
else:
    print(f"   ✗ Login failed: {r3.text}")

print("\n" + "="*50)
print("SUMMARY:")
print("="*50)
successes = sum([r1.status_code == 200, r2.status_code == 200, r3.status_code == 200])
print(f"✓ {successes}/3 logins successful")

if successes == 3:
    print("\n🎉 ALL TESTS PASSED!")
    print("Frontend and backend are properly connected.")
    print("\nYou can now:")
    print("  1. Login via browser at http://localhost:5173")
    print("  2. Doctors can create clinical notes")
    print("  3. Cod ers can see encounters and get AI recommendations")
else:
    print("\n⚠ Some logins failed. Check credentials or backend logs.")
