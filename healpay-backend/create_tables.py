"""
Script to create database tables
Run this if tables are not being created automatically
"""
from app.db.database import engine
from app.db import models

print("Creating database tables...")

try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ Tables created successfully!")
    print("\nTables created:")
    print("- users")
except Exception as e:
    print(f"❌ Error creating tables: {e}")

