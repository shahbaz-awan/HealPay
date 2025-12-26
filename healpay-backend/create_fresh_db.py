# -*- coding: utf-8 -*-
"""
Creates a completely fresh database
Run this AFTER deleting the corrupted healpay.db file
"""

import os
import sys

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db import models
from app.core.security import get_password_hash
from app.db.models import User, UserRole

print("===== Creating Fresh Database =====\n")

db_file = 'healpay.db'

# Check if database already exists
if os.path.exists(db_file):
    print(f"[ERROR] Database file {db_file} already exists!")
    print("Please delete it first before running this script.")
    print(f"\nRun: Remove-Item {db_file} -Force\n")
    sys.exit(1)

# Create new database
print("Creating new database...")
engine = create_engine(
    f'sqlite:///{db_file}',
    connect_args={"check_same_thread": False}
)

try:
    # Create all tables
    models.Base.metadata.create_all(bind=engine)
    print("[OK] Database created with all tables\n")
except Exception as e:
    print(f"[ERROR] Failed to create database: {e}\n")
    sys.exit(1)

# Seed users
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
    engine.dispose()

print("===== Database Created Successfully! =====")
print("\nYou can now start the backend:")
print("  python main.py")
print("\nDefault credentials:")
print("  admin@healpay.com / admin123")
print("  doctor@healpay.com / doctor123")
print("  patient@healpay.com / patient123\n")
