#!/usr/bin/env python
"""
Test Script for HealPay Recommendation System
Tests the AI-powered medical code recommendation endpoint
"""
import requests
import json
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8000/api"
CODER_EMAIL = "coder@healpay.com"
CODER_PASSWORD = "Coder@57"

def print_header(title):
    """Print a formatted header"""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def print_section(title):
    """Print a section divider"""
    print(f"\n--- {title} ---")

def test_recommendation_system():
    """Main test function"""
    print_header("HEALPAY RECOMMENDATION SYSTEM TEST")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Backend URL: {BASE_URL}")
    
    # Step 1: Authenticate as coder
    print_section("Step 1: Authentication")
    try:
        login_response = requests.post(
            f"{BASE_URL}/v1/auth/login",
            json={"email": CODER_EMAIL, "password": CODER_PASSWORD}
        )
        login_response.raise_for_status()
        login_data = login_response.json()
        token = login_data.get("access_token")
        user_info = login_data.get("user", {})
        
        print(f"✓ Logged in as: {user_info.get('email')} ({user_info.get('role')})")
        print(f"✓ Token received: {token[:20]}...")
        
    except Exception as e:
        print(f"✗ Authentication failed: {e}")
        return False
    
    # Prepare headers
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Get list of encounters
    print_section("Step 2: Fetching Clinical Encounters")
    try:
        encounters_response = requests.get(
            f"{BASE_URL}/v1/clinical/encounters",
            headers=headers
        )
        encounters_response.raise_for_status()
        encounters = encounters_response.json()
        
        if not encounters:
            print("✗ No encounters found in the database")
            print("  Run 'python seed_test_data.py' to create test data")
            return False
        
        print(f"✓ Found {len(encounters)} clinical encounters")
        
        # Display encounter details
        for idx, encounter in enumerate(encounters[:5], 1):
            print(f"\n  [{idx}] Encounter ID: {encounter.get('id')}")
            print(f"      Chief Complaint: {encounter.get('chief_complaint', 'N/A')}")
            print(f"      Status: {encounter.get('status', 'N/A')}")
            
    except Exception as e:
        print(f"✗ Failed to fetch encounters: {e}")
        return False
    
    # Step 3: Test recommendation system on first encounter
    print_section("Step 3: Testing AI Recommendation System")
    test_encounter_id = encounters[0].get('id')
    print(f"Testing with Encounter ID: {test_encounter_id}")
    print(f"Chief Complaint: {encounters[0].get('chief_complaint')}")
    
    try:
        rec_response = requests.get(
            f"{BASE_URL}/v1/clinical/encounters/{test_encounter_id}/recommendations",
            headers=headers
        )
        rec_response.raise_for_status()
        recommendations = rec_response.json()
        
        print("\n✓ Recommendation API responded successfully!")
        print(f"\nResponse Summary:")
        print(f"  Total Recommendations: {recommendations.get('total_recommendations', 0)}")
        print(f"  ICD-10 Codes: {len(recommendations.get('icd10_recommendations', []))}")
        print(f"  CPT Codes: {len(recommendations.get('cpt_recommendations', []))}")
        
        # Display ICD-10 recommendations
        if recommendations.get('icd10_recommendations'):
            print_section("ICD-10 Diagnosis Code Recommendations")
            for idx, rec in enumerate(recommendations['icd10_recommendations'], 1):
                print(f"\n  [{idx}] {rec.get('code')} - {rec.get('description')}")
                print(f"      Confidence: {rec.get('confidence_score', 0):.2%}")
                print(f"      Explanation: {rec.get('explanation', 'N/A')}")
                if rec.get('matched_keywords'):
                    print(f"      Keywords: {', '.join(rec.get('matched_keywords', []))}")
        
        # Display CPT recommendations
        if recommendations.get('cpt_recommendations'):
            print_section("CPT Procedure Code Recommendations")
            for idx, rec in enumerate(recommendations['cpt_recommendations'], 1):
                print(f"\n  [{idx}] {rec.get('code')} - {rec.get('description')}")
                print(f"      Confidence: {rec.get('confidence_score', 0):.2%}")
                print(f"      Explanation: {rec.get('explanation', 'N/A')}")
                if rec.get('matched_keywords'):
                    print(f"      Keywords: {', '.join(rec.get('matched_keywords', []))}")
        
        print_header("TEST COMPLETED SUCCESSFULLY ✓")
        print("\nRecommendation System Status: WORKING")
        print("\nNext Steps:")
        print("  1. Open http://localhost:5173 in your browser")
        print("  2. Login as coder (coder@healpay.com / Coder@57)")
        print("  3. Navigate to an encounter in the Coder Dashboard")
        print("  4. Click 'Get AI Recommendations' button")
        print("  5. Verify recommendations match the API results above")
        
        return True
        
    except requests.exceptions.HTTPError as e:
        print(f"\n✗ Recommendation API failed: {e}")
        print(f"   Status Code: {rec_response.status_code}")
        print(f"   Response: {rec_response.text}")
        
        if rec_response.status_code == 500:
            print("\n   Possible Issues:")
            print("   - Code library not initialized (run seed_test_data.py)")
            print("   - ML model not loaded (first request takes 30-60 seconds)")
            print("   - Missing dependencies (check requirements.txt)")
        
        return False
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        return False

if __name__ == "__main__":
    try:
        success = test_recommendation_system()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        exit(1)
