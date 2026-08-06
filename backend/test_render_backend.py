"""
Test script for Render backend endpoints.
Tests the deployed backend on aggriscan.onrender.com
"""
import requests
import json

# Render backend URL
BASE_URL = "https://aggriscan.onrender.com"

def test_health():
    """Test health endpoint"""
    print("=" * 70)
    print("  TEST: Backend Health Check")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Backend is healthy!")
            print(f"  Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"[FAIL] Health check failed: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False

def test_config():
    """Test config endpoint"""
    print("\n" + "=" * 70)
    print("  TEST: Backend Config")
    print("=" * 70)
    
    try:
        response = requests.get(f"{BASE_URL}/health/config", timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("[OK] Config endpoint working!")
            print(f"\nAI Configuration:")
            print(f"  Gemini API Key Configured: {data.get('ai', {}).get('gemini_api_key_configured')}")
            print(f"  PlantNet API Key Configured: {data.get('ai', {}).get('plantnet_api_key_configured')}")
            print(f"  PlantID API Key Configured: {data.get('ai', {}).get('plantid_api_key_configured')}")
            print(f"\nSMS Configuration:")
            print(f"  Provider: {data.get('sms', {}).get('provider')}")
            print(f"  Provider Ready: {data.get('sms', {}).get('provider_ready')}")
            print(f"\nModels Available:")
            models = data.get('models', {}).get('files', {})
            for model, exists in models.items():
                print(f"  {model}: {'[OK]' if exists else '[MISSING]'}")
            return True
        else:
            print(f"[FAIL] Config check failed: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False

def test_auth_login():
    """Test login endpoint"""
    print("\n" + "=" * 70)
    print("  TEST: Auth Login")
    print("=" * 70)
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/auth/login",
            json={"phone_number": "+256700000001", "password": "Password123"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            token = data.get('access_token', '')
            print("[OK] Login successful!")
            print(f"  Token received (length: {len(token)})")
            print(f"  Token type: {data.get('token_type')}")
            return data
        else:
            print(f"[FAIL] Login failed: {response.status_code}")
            print(f"Response: {response.text[:300]}")
            return None
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return None

def test_api_endpoints_without_auth():
    """Test API endpoints without authentication (should get 401)"""
    print("\n" + "=" * 70)
    print("  TEST: API Endpoints (No Auth - Expect 401)")
    print("=" * 70)
    
    endpoints = [
        ("GET", "/api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000"),
        ("GET", "/api/v1/reports/hotspots"),
        ("POST", "/api/v1/reports/sync"),
    ]
    
    all_ok = True
    for method, endpoint in endpoints:
        try:
            if method == "GET":
                response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
            else:
                response = requests.post(f"{BASE_URL}{endpoint}", json=[], timeout=10)
            
            status_ok = response.status_code == 401
            print(f"  {method} {endpoint}: {response.status_code} {'[OK]' if status_ok else '[UNEXPECTED]'}")
            all_ok = all_ok and status_ok
        except Exception as e:
            print(f"  {method} {endpoint}: [FAIL] {e}")
            all_ok = False
    
    return all_ok

def main():
    print("\n" + "=" * 70)
    print("  AGRI-SCAN RENDER BACKEND TEST")
    print(f"  Backend URL: {BASE_URL}")
    print("=" * 70)
    
    results = []
    
    # Test 1: Health
    health_ok = test_health()
    results.append(("Health Check", health_ok))
    
    # Test 2: Config
    config_ok = test_config()
    results.append(("Config Check", config_ok))
    
    # Test 3: Auth endpoints
    token_data = test_auth_login()
    auth_ok = token_data is not None
    results.append(("Auth Login", auth_ok))
    
    # Test 4: API endpoints without auth
    api_ok = test_api_endpoints_without_auth()
    results.append(("API Endpoints (401 check)", api_ok))
    
    # Summary
    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        print(f"  {'[PASS]' if result else '[FAIL]'}: {name}")
    
    print(f"\n  Total: {passed}/{total} test groups passed")
    
    if passed == total:
        print("\n[SUCCESS] Backend is fully functional on Render!")
    else:
        print(f"\n[WARNING] {total - passed} test group(s) had issues")
    
    print("=" * 70)

if __name__ == '__main__':
    main()