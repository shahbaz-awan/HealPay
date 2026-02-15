"""Simple admin API test"""
import requests
import json

print("Testing Admin Dashboard API")
print("="*50)

# Login as admin
r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@healpay.com", "password": "admin123"}
)

if r.status_code != 200:
    print(f"Login failed: {r.status_code}")
    print(r.text)
    exit(1)

token = r.json()['token']
print("Admin login: OK")

# Get all users
r2 = requests.get(
    "http://localhost:8000/api/v1/admin/users",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"\nGet Users API Status: {r2.status_code}")

if r2.status_code == 200:
    users = r2.json()
    print(f"Total users returned: {len(users)}")
    
    print("\nUsers List:")
    for u in users:
        uid = u.get('id', '?')
        email = u.get('email', 'N/A')
        role = u.get('role', 'N/A')
        fname = u.get('first_name', '')
        lname = u.get('last_name', '')
        
        print(f"  ID {uid}: {email} | {role} | {fname} {lname}")
    
    # Save to file for detailed inspection
    with open('admin_users_response.json', 'w') as f:
        json.dump(users, f, indent=2)
    
    print(f"\nFull response saved to: admin_users_response.json")
    
    # Check what fields are present
    if users:
        print("\nFields in user object:")
        for key in users[0].keys():
            print(f"  - {key}")
    
else:
    print(f"API Error: {r2.status_code}")
    print(r2.text[:500])
