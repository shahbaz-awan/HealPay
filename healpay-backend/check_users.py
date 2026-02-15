"""Check what users exist and test login"""
from app.db.database import SessionLocal
from app.db.models import User
from app.core.security import verify_password

db = SessionLocal()

try:
    users = db.query(User).all()
    print("Current users in database:")
    print("="*70)
    for u in users:
        print(f"Email: {u.email:30} | Role: {u.role.value:10} | ID: {u.id}")
    print("="*70)
    print(f"\nTotal: {len(users)} users")
    
    # Test known passwords
    print("\n" + "="*70)
    print("Testing login credentials:")
    print("="*70)
    
    test_creds = [
        ("doctor@healpay.com", "doctor123"),
        ("coder@healpay.com", "coder123"),
        ("coder@healpay.com", "Coder@57"),
        ("admin@healpay.com", "admin123"),
        ("admin@healpay.com", "Admin@123"),
        ("patient@healpay.com", "patient123"),
    ]
    
    for email, password in test_creds:
        user = db.query(User).filter(User.email == email).first()
        if user:
            is_valid = verify_password(password, user.hashed_password)
            status = "✓ WORKS" if is_valid else "✗ WRONG PASSWORD"
            print(f"{email:30} + '{password:15}' = {status}")
        else:
            print(f"{email:30} - USER NOT FOUND")
    
finally:
    db.close()
