"""Test recommendation system directly"""
import requests
import json

BASE_URL = "http://localhost:8000/api/v1"

print("="*70)
print("TESTING RECOMMENDATION ENGINE")
print("="*70)

# 1. Login as coder
print("\n1. Logging in as coder...")
login_response = requests.post(
    f"{BASE_URL}/auth/login",
    json={"email": "coder@healpay.com", "password": "Coder@57"}
)

if login_response.status_code != 200:
    print(f"   ✗ Login failed: {login_response.status_code}")
    print(f"   Response: {login_response.text}")
    exit(1)

token = login_response.json()['token']
print("   ✓ Login successful")

# 2. Get pending encounters
print("\n2. Getting pending encounters...")
headers = {"Authorization": f"Bearer {token}"}
encounters_response = requests.get(
    f"{BASE_URL}/clinical/encounters/pending-coding",
    headers=headers
)

if encounters_response.status_code != 200:
    print(f"   ✗ Failed to get encounters: {encounters_response.status_code}")
    print(f"   Response: {encounters_response.text}")
    exit(1)

encounters = encounters_response.json()
print(f"   ✓ Found {len(encounters)} pending encounter(s)")

if len(encounters) == 0:
    print("\n⚠ No pending encounters to test recommendations on!")
    exit(0)

# Show first encounter
first_encounter = encounters[0]
encounter_id = first_encounter['id']
print(f"\n   Testing with Encounter ID: {encounter_id}")
print(f"   Patient: {first_encounter.get('patient_name', 'Unknown')}")
print(f"   Complaint: {first_encounter.get('chief_complaint', 'N/A')[:50]}...")

# 3. Test recommendation endpoint
print(f"\n3. Getting AI recommendations for encounter {encounter_id}...")
rec_response = requests.get(
    f"{BASE_URL}/clinical/encounters/{encounter_id}/recommendations",
    headers=headers
)

print(f"   Status Code: {rec_response.status_code}")

if rec_response.status_code == 200:
    print("   ✓ RECOMMENDATIONS WORKING!")
    
    recommendations = rec_response.json()
    print(f"\n   Total recommendations: {recommendations.get('total_recommendations', 0)}")
    
    icd_recs = recommendations.get('icd10_recommendations', [])
    cpt_recs = recommendations.get('cpt_recommendations', [])
    
    print(f"\n   ICD-10 Recommendations ({len(icd_recs)}):")
    for rec in icd_recs[:3]:
        print(f"     • {rec['code']}: {rec['description'][:50]}")
        print(f"       Confidence: {rec['confidence_score']:.2%}")
        print(f"       {rec.get('explanation', '')}")
    
    print(f"\n   CPT Recommendations ({len(cpt_recs)}):")
    for rec in cpt_recs[:3]:
        print(f"     • {rec['code']}: {rec['description'][:50]}")
        print(f"       Confidence: {rec['confidence_score']:.2%}")
        print(f"       {rec.get('explanation', '')}")
    
    print("\n" + "="*70)
    print("✓✓✓ AI RECOMMENDATION ENGINE IS WORKING! ✓✓✓")
    print("="*70)
    
else:
    print(f"   ✗ RECOMMENDATIONS FAILED!")
    print(f"   Response: {rec_response.text[:500]}")
    
    # Try to parse error
    try:
        error = rec_response.json()
        print(f"\n   Error details: {json.dumps(error, indent=2)}")
    except:
        pass
    
    print("\n" + "="*70)
    print("POSSIBLE CAUSES:")
    print("="*70)
    print("1. ML model not loaded (check backend logs)")
    print("2. Code library embeddings not computed")
    print("3. Missing dependencies (sentence-transformers, torch)")
    print("4. Insufficient memory for ML model")
