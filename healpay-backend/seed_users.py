"""
Database seeding script to create initial users
Run this to create test users for all roles
"""
from sqlalchemy.orm import Session
from app.db.database import SessionLocal, engine
from app.db.models import User, UserRole, Base
from app.core.security import get_password_hash

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

def seed_users():
    """Create initial users for testing"""
    db = SessionLocal()
    
    try:
        # Define users to create
        users_to_create = [
            {
                "email": "admin@healpay.com",
                "password": "admin123",
                "first_name": "Admin",
                "last_name": "User",
                "role": UserRole.ADMIN
            },
            {
                "email": "doctor@healpay.com",
                "password": "doctor123",
                "first_name": "Dr. Sarah",
                "last_name": "Johnson",
                "role": UserRole.DOCTOR
            },
            {
                "email": "coder@healpay.com",
                "password": "coder123",
                "first_name": "Alice",
                "last_name": "Thompson",
                "role": UserRole.CODER
            },
            {
                "email": "billing@healpay.com",
                "password": "billing123",
                "first_name": "Robert",
                "last_name": "Chen",
                "role": UserRole.BILLING
            },
            {
                "email": "patient@healpay.com",
                "password": "patient123",
                "first_name": "John",
                "last_name": "Doe",
                "role": UserRole.PATIENT
            }
        ]
        
        created_count = 0
        skipped_count = 0
        
        for user_data in users_to_create:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            
            if existing_user:
                print(f"[SKIP] User already exists: {user_data['email']}")
                skipped_count += 1
                continue
            
            # Create new user
            hashed_password = get_password_hash(user_data["password"])
            new_user = User(
                email=user_data["email"],
                hashed_password=hashed_password,
                first_name=user_data["first_name"],
                last_name=user_data["last_name"],
                role=user_data["role"]
            )
            
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            
            print(f"[OK] Created user: {user_data['email']} (Role: {user_data['role'].value})")
            created_count += 1
        
        print("\n" + "="*60)
        print(f"SEEDING COMPLETE!")
        print(f"Created: {created_count} users")
        print(f"Skipped: {skipped_count} users (already exist)")
        print("="*60)
        
        if created_count > 0:
            print("\nYou can now login with these credentials:")
            print("\nADMIN:")
            print("  Email: admin@healpay.com")
            print("  Password: admin123")
            print("\nDOCTOR:")
            print("  Email: doctor@healpay.com")
            print("  Password: doctor123")
            print("\nCODER:")
            print("  Email: coder@healpay.com")
            print("  Password: coder123")
            print("\nBILLING:")
            print("  Email: billing@healpay.com")
            print("  Password: billing123")
            print("\nPATIENT:")
            print("  Email: patient@healpay.com")
            print("  Password: patient123")
        
    except Exception as e:
        print(f"[ERROR] Failed to seed users: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Starting database seeding...")
    print("="*60)
    seed_users()


