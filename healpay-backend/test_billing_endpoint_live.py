from fastapi.testclient import TestClient
from main import app
from app.core.security import create_access_token
from app.db.database import SessionLocal
from app.db.models import User

client = TestClient(app)

def test_get_ready_encounters():
    print("Testing /api/v1/billing/encounters/ready...")
    
    # 1. Get a valid user (Biller or Admin) to authenticate
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@healpay.com").first() # Using admin as they usually have access
    if not user:
        # Fallback to creating a fake token subject if admin doesn't exist (depends on how auth is mocked/checked)
        # But let's try to assume admin exists from previous context
        print("Warning: Admin user not found in DB for test script. Using mock logic if needed.")
        user_id = 1
    else:
        user_id = user.id
    
    # Create token
    access_token = create_access_token(subject=user.email if user else "admin@test.com")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Call the endpoint
    response = client.get("/api/v1/billing/encounters/ready", headers=headers)
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Data received: {len(data)} items")
        print(data)
    else:
        print(f"Error: {response.text}")

if __name__ == "__main__":
    test_get_ready_encounters()
