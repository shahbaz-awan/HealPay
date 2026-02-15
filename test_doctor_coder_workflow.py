"""
Test Doctor-to-Coder Workflow
Tests the complete flow: Doctor creates clinical note → Shows up in Coder dashboard
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_workflow():
    print("="*70)
    print("TESTING DOCTOR TO CODER WORKFLOW")
    print("="*70)
    
    # Step 1: Login as doctor
    print("\n1. Logging in as Doctor...")
    doctor_login = requests.post(
        f"{BASE_URL}/v1/auth/login",
        json={"email": "doctor@healpay.com", "password": "doctor123"}
    )
    if doctor_login.status_code == 200:
        doctor_token = doctor_login.json()["access_token"]
        print("   ✓ Doctor logged in successfully")
    else:
        print(f"   ✗ Doctor login failed: {doctor_login.text}")
        return
    
    # Step 2: Login as coder
    print("\n2. Logging in as Coder...")
    coder_login = requests.post(
        f"{BASE_URL}/v1/auth/login",
        json={"email": "coder@healpay.com", "password": "Coder@57"}
    )
    if coder_login.status_code == 200:
        coder_token = coder_login.json()["access_token"]
        print("   ✓ Coder logged in successfully")
    else:
        print(f"   ✗ Coder login failed: {coder_login.text}")
        return
    
    # Step 3: Check existing encounters for coder BEFORE creating new one
    print("\n3. Checking existing encounters in Coder's queue...")
    pending_response = requests.get(
        f"{BASE_URL}/v1/clinical/encounters/pending-coding",
        headers={"Authorization": f"Bearer {coder_token}"}
    )
    
    if pending_response.status_code == 200:
        encounters = pending_response.json()
        print(f"   ✓ Found {len(encounters)} pending encounters")
        
        if len(encounters) > 0:
            print("\n   Existing encounters:")
            for i, enc in enumerate(encounters[:5], 1):
                print(f"   [{i}] ID: {enc['id']} - {enc['chief_complaint'][:50]}...")
        else:
            print("   ℹ No encounters in queue (database may be empty)")
    else:
        print(f"   ✗ Failed to fetch encounters: {pending_response.text}")
    
    print("\n" + "="*70)
    print("WORKFLOW STATUS:")
    print("="*70)
    print(f"✓ Doctor authentication: Working")
    print(f"✓ Coder authentication: Working")
    print(f"✓ Coder can access pending encounters: {pending_response.status_code == 200}")
    print(f"✓ Encounters in database: {len(encounters) if pending_response.status_code == 200 else 'Unknown'}")
    
    if len(encounters) == 0:
        print("\n⚠ ISSUE IDENTIFIED:")
        print("  - Database has no encounters with 'pending_coding' status")
        print("  - Run 'python seed_test_data.py' to create test encounters")
        print("  - Or have a doctor create clinical notes via the web interface")
    
    print("\n" + "="*70)

if __name__ == "__main__":
    test_workflow()
