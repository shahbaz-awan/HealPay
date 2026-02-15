"""Simple test of recommendations"""
import requests

# Login
r = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "coder@healpay.com", "password": "Coder@57"}
)
token = r.json()['token']

# Get recommendations for encounter 1
r2 = requests.get(
    "http://localhost:8000/api/v1/clinical/encounters/1/recommendations",
    headers={"Authorization": f"Bearer {token}"}
)

print(f"Status: {r2.status_code}")
if r2.status_code == 200:
    print("✓✓✓ RECOMMENDATIONS WORKING! ✓✓✓")
    data = r2.json()
    print(f"Total: {data.get('total_recommendations', 0)}")
    print(f"ICD-10: {len(data.get('icd10_recommendations', []))}")
    print(f"CPT: {len(data.get('cpt_recommendations', []))}")
else:
    print("✗ FAILED")
    print(r2.text[:500])
