"""
Run this script to create the new database tables for clinical encounters
Usage: python migrate_clinical_tables.py
"""
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import engine
from app.db import models

# Create all tables
print("Creating database tables...")
models.Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")
print("\nNew tables added:")
print("  - clinical_encounters")
print("  - medical_codes")
print("  - claims")
