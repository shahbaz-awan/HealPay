import requests

BASE_URL = "http://localhost:8000/api/v1"

print("="*70)
print("TESTING ALL USER LOGINS")
print("="*70)

credentials = [
    ("admin@healpay.com", "admin123", "ADMIN"),
    ("doctor@healpay.com", "doctor123", "DOCTOR"),
    ("coder@healpay.com", "coder123", "CODER"),
    ("billing@healpay.com", "billing123", "BILLING"),
    ("patient@healpay.com", "patient123", "PATIENT"),
]

working = []
failed = []

for email, password, role in credentials:
    try:
        r = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password},
            timeout=5
        )
        
        if r.status_code == 200:
            print(f"✓ {role:10} - {email:30} - SUCCESS")
            working.append((role, email, password))
        else:
            print(f"✗ {role:10} - {email:30} - FAILED ({r.status_code})")
            failed.append((role, email, password, r.status_code))
    except Exception as e:
        print(f"✗ {role:10} - {email:30} - ERROR: {str(e)[:30]}")
        failed.append((role, email, password, str(e)))

print("\n" + "="*70)
print(f"SUMMARY: {len(working)}/{len(credentials)} logins working")
print("="*70)

if working:
    print("\n✓ WORKING CREDENTIALS:")
    print("-" * 70)
    for role, email, pwd in working:
        print(f"\n{role}:")
        print(f"  Email:    {email}")
        print(f"  Password: {pwd}")

if failed:
    print("\n\n✗ FAILED LOGINS:")
    print("-" * 70)
    for item in failed:
        role, email, pwd = item[:3]
        error = item[3] if len(item) > 3 else "Unknown"
        print(f"{role}: {email} - Error: {error}")
