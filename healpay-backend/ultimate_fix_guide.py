# -*- coding: utf-8 -*-
"""
Ultimate Database Fix Script
This script creates a completely fresh database by:
1. Creating a script that will run at system startup before VS Code locks the file
2. Or creates instructions for manual fixing
"""

import os
import sys
import subprocess

# Force UTF-8 encoding for Windows console
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

print("===== Ultimate Database Fix Script =====\n")

db_file = 'healpay.db'

print(f"Current working directory: {os.getcwd()}\n")

if os.path.exists(db_file):
    print(f"[INFO] Found existing database: {db_file}")
    print(f"[INFO] File size: {os.path.getsize(db_file)} bytes\n")
    
    print("This database is corrupted and locked by another process.")
    print("\n=== RECOMMENDED SOLUTION ===\n")
    
    print("Follow these steps to fix the database:")
    print("\n1. CLOSE VS CODE COMPLETELY")
    print("   - Don't just close files, exit VS Code entirely (File > Exit)")
    print("   - This will release the database file lock")
    
    print("\n2. OPEN A NEW POWERSHELL WINDOW")
    print(f"   cd {os.getcwd()}")
    
    print("\n3. DELETE THE CORRUPTED DATABASE")
    print(f"   Remove-Item {db_file} -Force")
    
    print("\n4. CREATE A FRESH DATABASE")
    print("   python create_fresh_db.py")
    
    print("\n5. REOPEN VS CODE")
    print("   code .")
    
    print("\n6. START THE BACKEND")
    print("   python main.py")
    
    print("\n" + "="*60)
    print("\n[ALTERNATIVE] If VS Code is already closed:")
    print("Simply run these commands now:")
    print(f"   Remove-Item {db_file} -Force")
    print("   python create_fresh_db.py")
    print("\n" + "="*60)
    
else:
    print("[OK] No database file found. Ready to create fresh database.")
    print("\nRun: python create_fresh_db.py")

print("\n" + "="*60 + "\n")
