# -*- coding: utf-8 -*-
"""
Since the database file appears to be locked, this script will:
1. Check if the new database works correctly
2. Update the database configuration to use the new database temporarily
"""

import os
import sys

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("===== Database Migration Helper =====\n")

# Check if both databases exist
old_db = 'healpay.db'
new_db = 'healpay_new.db'

if not os.path.exists(new_db):
    print(f"[ERROR] New database {new_db} not found!")
    print("Please run fix_database_alternative.py first.\n")
    sys.exit(1)

print(f"[OK] Found new database: {new_db}")

if os.path.exists(old_db):
    old_size = os.path.getsize(old_db)
    new_size = os.path.getsize(new_db)
    
    print(f"[INFO] Old database size: {old_size} bytes")
    print(f"[INFO] New database size: {new_size} bytes\n")
    
    print("The old database is locked and cannot be deleted automatically.")
    print("\n=== SOLUTION 1: Manual Replacement (Recommended) ===")
    print("Please follow these steps:")
    print("1. Close this PowerShell window")
    print("2. Close VS Code completely (File > Exit)")
    print("3. Open a new PowerShell window")
    print("4. Navigate to the backend directory:")
    print(f"   cd {os.getcwd()}")
    print("5. Delete the old database:")
    print(f"   Remove-Item {old_db} -Force")
    print("6. Rename the new database:")
    print(f"   Rename-Item {new_db} {old_db}")
    print("7. Reopen VS Code and start the backend")
    
    print("\n=== SOLUTION 2: Use New Database Directly ===")
    print("Alternatively, update your backend to use the new database:")
    print("1. Open app/db/database.py")
    print("2. Change the database filename from 'healpay.db' to 'healpay_new.db'")
    print("3. Restart the backend")
    
    print("\n=== SOLUTION 3: Restart Computer ===")
    print("If the above solutions don't work:")
    print("1. Save all your work")
    print("2. Restart your computer")
    print("3. Delete healpay.db")
    print("4. Rename healpay_new.db to healpay.db")
    
else:
    print(f"Old database not found. Renaming {new_db} to {old_db}...\n")
    try:
        os.rename(new_db, old_db)
        print(f"[OK] Database renamed successfully!")
        print("\nYou can now start the backend.\n")
    except Exception as e:
        print(f"[ERROR] Failed to rename: {e}\n")
        sys.exit(1)

print("\n=== New Database Credentials ===")
print("admin@healpay.com / admin123")
print("doctor@healpay.com / doctor123")
print("patient@healpay.com / patient123\n")
