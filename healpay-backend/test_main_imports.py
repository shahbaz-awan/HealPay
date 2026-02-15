import sys
import traceback

print("Testing main.py imports...")

try:
    print("1. Importing FastAPI...")
    from fastapi import FastAPI
    print("   ✓ FastAPI imported")
    
    print("2. Importing CORS middleware...")
    from fastapi.middleware.cors import CORSMiddleware
    print("   ✓ CORS imported")
    
    print("3. Importing settings...")
    from app.core.config import settings
    print("   ✓ Settings imported")
    
    print("4. Importing API router...")
    from app.api.v1.router import api_router
    print("   ✓ API router imported")
    
    print("5. Importing database engine...")
    from app.db.database import engine
    print("   ✓ Engine imported")
    
    print("6. Importing models...")
    from app.db import models
    print("   ✓ Models imported")
    
    print("7. Creating database tables...")
    models.Base.metadata.create_all(bind=engine)
    print("   ✓ Tables created")
    
    print("\n✅ All imports successful!")
    
except Exception as e:
    print(f"\n✗ Failed at step!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
