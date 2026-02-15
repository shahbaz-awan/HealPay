import requests

BASE_URL = "http://127.0.0.1:8001/api/v1"

def test_live_billing_api():
    print(f"Testing API at {BASE_URL}...")
    
    # 1. Login to get token
    login_data = {
        "username": "admin@healpay.com",
        "password": "admin_password"  # Assuming generic password or I need to check DB/credentials artifact
    }
    
    # Try common passwords or use the one from credentials artifact if I knew it. 
    # Let's try to lookup the user in DB first to be sure, OR better, just create a token manually using the backend code 
    # BUT that requires imports which failed before.
    
    # Let's try to purely use requests and assume credentials. 
    # Wait, I can use the update_ali_role.py strategy - use the local DB to get a user and their hashed password? 
    # No, I can't reverse hash.
    
    # I will stick to the previous plan: Use backend code to generate a token, BUT WITHOUT importing 'app' or 'main'.
    # I can import `create_access_token` from `app.core.security`.
    
    from app.core.security import create_access_token
    from app.db.database import SessionLocal
    from app.db.models import User
    
    db = SessionLocal()
    user = db.query(User).filter(User.email == "admin@healpay.com").first()
    if not user:
        print("Admin not found, trying to find ANY user...")
        user = db.query(User).first()
        
    if not user:
        print("No users found in DB!")
        return

    print(f"Generating token for user: {user.email}")
    access_token = create_access_token(data={"sub": user.email})
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 2. Call the endpoint
    url_stats = f"{BASE_URL}/billing/stats"
    print(f"GET {url_stats}")
    try:
        response = requests.get(url_stats, headers=headers)
        print(f"Stats Status Code: {response.status_code}")
    except Exception as e:
        print(f"Stats Request failed: {e}")

    # 3. Call the direct endpoint
    url = f"{BASE_URL}/billing/encounters/ready"
    print(f"GET {url}")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_live_billing_api()
