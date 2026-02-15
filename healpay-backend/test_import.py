import sys
import traceback

try:
    from app.db import models
    print("✓ Models imported successfully")
except Exception as e:
    print("✗ Import failed!")
    print(f"\nError type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
