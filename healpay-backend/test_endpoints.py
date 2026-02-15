"""Test backend API endpoints to verify routing"""
import requests

base_urls = [
    "http://localhost:8000/api/auth/login",
    "http://localhost:8000/api/v1/auth/login",
    "http://localhost:8000/auth/login",
]

test_data = {"email": "test", "password": "test"}

print("=" * 60)
print("TESTING AUTH LOGIN ENDPOINTS")
print("=" * 60)

for url in base_urls:
    print(f"\nTrying: {url}")
    try:
        response = requests.post(url, json=test_data, timeout=2)
        print(f"  Status: {response.status_code}")
        if response.status_code != 404:
            print(f"  ✓ Endpoint exists!")
            print(f"  Response: {response.text[:200]}")
            break
    except requests.exceptions.ConnectionError:
        print(f"  ✗ Connection failed")
    except Exception as e:
        print(f"  ✗ Error: {e}")

# Also check what routes are actually registered
print("\n" + "=" * 60)
print("Checking /api/docs availability...")
try:
    response = requests.get("http://localhost:8000/api/docs")
    if response.status_code == 200:
        print("✓ API docs available at: http://localhost:8000/api/docs")
    else:
        print(f"Status: {response.status_code}")
except Exception as e:
    print(f"✗ Error: {e}")

print("=" * 60)
