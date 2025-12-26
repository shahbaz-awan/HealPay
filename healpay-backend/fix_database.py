# -*- coding: utf-8 -*-
import os
import sys
import sqlite3
import time
from app.db.database import engine
from app.db import models
from app.core.security import get_password_hash
from app.db.models import User, UserRole
from sqlalchemy.orm import sessionmaker

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("===== Database Fix Script =====\n")

# Try to backup corrupted database
db_file = 'healpay.db'
backup_file = 'healpay_corrupted_backup.db'

if os.path.exists(db_file):
    print("Attempting to fix corrupted database...")
    
    # Try multiple approaches to handle the locked file
    for attempt in range(3):
        try:
            print(f"Attempt {attempt + 1}/3: Backing up database...")
            if os.path.exists(backup_file):
                os.remove(backup_file)
            os.rename(db_file, backup_file)
            print(f"[OK] Backup created: {backup_file}\n")
            break
        except PermissionError as e:
            if attempt < 2:
                print(f"File is locked. Waiting 2 seconds...")
                time.sleep(2)
            else:
                print(f"\n[ERROR] Cannot access database file: {e}")
                print("\nThe database file is locked by another process.")
                print("\nPlease follow these steps:")
                print("1. Close any SQLite browser or database viewer")
                print("2. Stop the backend server if it's running")
                print("3. Close any database file preview in VS Code")
                print("4. Run this script again\n")
                print("If the problem persists, manually delete healpay.db and run this script again.\n")
                sys.exit(1)
        except Exception as e:
            print(f"[ERROR] Unexpected error: {e}\n")
            sys.exit(1)
else:
    print("No existing database found. Creating fresh database...\n")

# Create fresh database
print("Creating fresh database...")
try:
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created\n")
except Exception as e:
    print(f"[ERROR] Error creating database: {e}\n")
    sys.exit(1)

# Seed admin users
print("Seeding admin users...")
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

try:
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
            "first_name": "Dr. John",
            "last_name": "Smith",
            "role": UserRole.DOCTOR
        },
        {
            "email": "patient@healpay.com",
            "password": "patient123",
            "first_name": "Jane",
            "last_name": "Doe",
            "role": UserRole.PATIENT
        }
    ]
    
    for user_data in users_to_create:
        hashed_pw = get_password_hash(user_data['password'])
        user = User(
            email=user_data['email'],
            hashed_password=hashed_pw,
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            role=user_data['role']
        )
        db.add(user)
        print(f"  [OK] Created: {user_data['email']}")
    
    db.commit()
    print(f"\n[OK] Successfully created {len(users_to_create)} users\n")
    
except Exception as e:
    print(f"[ERROR] Error seeding users: {e}\n")
    db.rollback()
    sys.exit(1)
finally:
    db.close()

print("===== Database Fixed! =====")
print("\nYou can now start the backend:")
print("  python main.py")
print("\nDefault credentials:")
print("  admin@healpay.com / admin123")
print("  doctor@healpay.com / doctor123")
print("  patient@healpay.com / patient123")
