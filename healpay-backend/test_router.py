import sys
import traceback

print("Testing API router import...")

try:
    print("1. Testing direct router import...")
    from app.api.v1.router import api_router
    print("   ✓ Router imported successfully")
    
except Exception as e:
    print(f"\n✗ Router import failed!")
    print(f"Error type: {type(e).__name__}")
    print(f"Error message: {str(e)}")
    print("\nFull traceback:")
    traceback.print_exc()
