"""
Get all working credentials from the database
"""
from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import verify_password
import requests

db = SessionLocal()

print("="*70)
print("HEALPAY DATABASE - USER CREDENTIALS REPORT")
print("="*70)

try:
    users = db.query(User).all()
    
    print(f"\nTotal Users: {len(users)}\n")
    
    # Common password patterns to try
    password_patterns = {
        "admin": ["admin123", "Admin@123", "admin@123"],
        "doctor": ["doctor123", "Doctor@123", "doctor@123"],
        "coder": ["coder123", "Coder@123", "Coder@57", "coder@123"],
        "billing": ["billing123", "Billing@123", "billing@123"],
        "patient": ["patient123", "Patient@123", "patient@123"],
    }
    
    working_creds = []
    
    for user in users:
        print(f"\nUser: {user.email}")
        print(f"  Role: {user.role.value}")
        print(f"  ID: {user.id}")
        print(f"  Name: {user.first_name} {user.last_name}")
        
        # Try to find working password
        role_key = user.role.value.lower()
        passwords_to_try = password_patterns.get(role_key, ["password123"])
        
        found_password = None
        for pwd in passwords_to_try:
            if verify_password(pwd, user.hashed_password):
                found_password = pwd
                break
        
        if found_password:
            print(f"  ✓ PASSWORD: {found_password}")
            working_creds.append((user.email, found_password, user.role.value))
        else:
            print(f"  ✗ PASSWORD: Unknown (none of the common passwords work)")
    
    # Summary
    print("\n" + "="*70)
    print("WORKING LOGIN CREDENTIALS")
    print("="*70)
    
    if working_creds:
        for email, pwd, role in sorted(working_creds, key=lambda x: x[2]):
            print(f"\n{role.upper()}:")
            print(f"  Email: {email}")
            print(f"  Password: {pwd}")
    else:
        print("\n⚠ WARNING: No working passwords found!")
        print("You need to reseed the database with known passwords.")
    
    # Test API login
    if working_creds:
        print("\n" + "="*70)
        print("TESTING API LOGIN")
        print("="*70)
        
        for email, pwd, role in working_creds[:3]:  # Test first 3
            try:
                r = requests.post(
                    "http://localhost:8000/api/v1/auth/login",
                    json={"email": email, "password": pwd},
                    timeout=5
                )
                status = "✓ SUCCESS" if r.status_code == 200 else f"✗ FAILED ({r.status_code})"
                print(f"{email:30} - {status}")
            except Exception as e:
                print(f"{email:30} - ✗ ERROR: {str(e)[:40]}")
    
finally:
    db.close()

print("\n" + "="*70)
