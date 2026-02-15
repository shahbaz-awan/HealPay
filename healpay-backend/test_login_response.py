"""Test login response structure"""
import requests

login_url = "http://localhost:8000/api/auth/login"
login_data = {"email": "coder@healpay.com", "password": "Coder@57"}

print("Testing login...")
response = requests.post(login_url, json=login_data)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    print(f"\nResponse keys: {list(data.keys())}")
    print(f"\nFull response:")
    import json
    print(json.dumps(data, indent=2, default=str))
else:
    print(f"Error: {response.text}")
