# -*- coding: utf-8 -*-
import os
import sys
import time
import gc

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("===== Database Corruption Fix - Alternative Method =====\n")

db_file = 'healpay.db'
backup_file = f'healpay_backup_{int(time.time())}.db'

if os.path.exists(db_file):
    print(f"Found database file: {db_file}")
    print(f"\nSince the file is locked, we'll use an alternative approach.\n")
    
    # Import SQLAlchemy and recreate with a different name
    print("Step 1: Creating a new clean database with a temporary name...")
    
    temp_db_file = 'healpay_new.db'
    
    # Remove temp file if it exists
    if os.path.exists(temp_db_file):
        try:
            os.remove(temp_db_file)
        except:
            pass
    
    # Temporarily set the database URL to new file
    os.environ['DATABASE_URL'] = f'sqlite:///{temp_db_file}'
    
    from sqlalchemy import create_engine
    from sqlalchemy.orm import sessionmaker
    from app.db import models
    from app.core.security import get_password_hash
    from app.db.models import User, UserRole
    
    # Create new engine with the temporary database
    temp_engine = create_engine(
        f'sqlite:///{temp_db_file}',
        connect_args={"check_same_thread": False}
    )
    
    # Create all tables
    try:
        models.Base.metadata.create_all(bind=temp_engine)
        print("[OK] New database created with all tables\n")
    except Exception as e:
        print(f"[ERROR] Failed to create database: {e}\n")
        sys.exit(1)
    
    # Seed admin users
    print("Step 2: Seeding admin users...")
    SessionLocal = sessionmaker(bind=temp_engine)
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
        temp_engine.dispose()
        gc.collect()
    
    # Now try to replace the old database
    print("\nStep 3: Replacing old database...")
    print("\nPlease follow these steps:")
    print(f"1. Close this window or any database viewer")
    print(f"2. In VS Code, close the healpay.db file if it's open")
    print(f"3. Manually delete or rename the file: {db_file}")
    print(f"4. Rename {temp_db_file} to {db_file}")
    print("\nAlternatively, run the following commands:")
    print(f"   del {db_file}")
    print(f"   ren {temp_db_file} {db_file}")
    
    print(f"\n[OK] New database created as: {temp_db_file}")
    print("After renaming, you can start the backend.\n")
    
else:
    print("No existing database found.\n")
    print("Creating fresh database...")
    
    from app.db.database import engine
    from app.db import models
    from app.core.security import get_password_hash
    from app.db.models import User, UserRole
    from sqlalchemy.orm import sessionmaker
    
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

print("===== Database Setup Complete! =====")
print("\nDefault credentials:")
print("  admin@healpay.com / admin123")
print("  doctor@healpay.com / doctor123")
print("  patient@healpay.com / patient123")
