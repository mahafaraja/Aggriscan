"""
Comprehensive test script for PlantNet, Gemini APIs and backend endpoints.
Tests with the tomato_leaf_test.jpg image.
"""
import os
import sys
import json
import base64
import requests
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')
load_dotenv(env_path)

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Test image path
TEST_IMAGE = r"C:\Users\mahaf\Downloads\tomato_leaf_test.jpg"

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_env_config():
    """Test 1: Verify environment configuration"""
    print_section("TEST 1: Environment Configuration")
    
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    plantnet_key = os.getenv('PLANTNET_API_KEY', '')
    plantid_key = os.getenv('PLANTID_API_KEY', '')
    db_url = os.getenv('DATABASE_URL', '')
    
    print(f"  GEMINI_API_KEY configured: {bool(gemini_key)} (length: {len(gemini_key)})")
    print(f"  PLANTNET_API_KEY configured: {bool(plantnet_key)} (length: {len(plantnet_key)})")
    print(f"  PLANTID_API_KEY configured: {bool(plantid_key)} (value: {plantid_key[:20] if plantid_key else 'None'})")
    print(f"  DATABASE_URL configured: {bool(db_url)} (value: {db_url[:50] if db_url else 'None'})")
    
    # Check if keys are placeholders
    if plantid_key and plantid_key == "your_plantid_api_key_here":
        print("  [!] PLANTID_API_KEY is a placeholder - will be skipped in fallback chain")
    
    return {
        'gemini': bool(gemini_key),
        'plantnet': bool(plantnet_key),
        'plantid': bool(plantid_key) and plantid_key != "your_plantid_api_key_here",
        'db': bool(db_url)
    }

def test_plantnet_api():
    """Test 2: Test PlantNet API directly with tomato leaf image"""
    print_section("TEST 2: PlantNet API Direct Test")
    
    plantnet_key = os.getenv('PLANTNET_API_KEY', '')
    if not plantnet_key or plantnet_key == "your_plantnet_api_key_here":
        print("  ✗ PLANTNET_API_KEY not configured - skipping")
        return False
    
    if not os.path.exists(TEST_IMAGE):
        print(f"  ✗ Test image not found: {TEST_IMAGE}")
        return False
    
    print(f"  Image: {TEST_IMAGE}")
    print(f"  Image size: {os.path.getsize(TEST_IMAGE)} bytes")
    
    # PlantNet API endpoint
    plantnet_url = "https://my-api.plantnet.org/v2/identify/all"
    
    try:
        # Convert image to JPEG (PlantNet only accepts JPEG/PNG)
        from PIL import Image
        import io
        
        img = Image.open(TEST_IMAGE).convert('RGB')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)
        img_buffer.seek(0)
        
        files = {'images': ('image.jpg', img_buffer, 'image/jpeg')}
        data = {'organs': 'leaf'}
        headers = {'Authorization': f"Bearer {plantnet_key}"}
        
        print(f"  Sending request to PlantNet API...")
        response = requests.post(
            plantnet_url,
            files=files,
            data=data,
            headers=headers,
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"  ✗ PlantNet API error: {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False
        
        result = response.json()
        
        if result.get('results') and len(result['results']) > 0:
            best_match = result['results'][0]
            species = best_match.get('species', {})
            common_names = species.get('commonNames', [])
            scientific_name = species.get('scientificName', species.get('scientificNameWithoutAuthor', 'Unknown'))
            confidence = best_match.get('score', 0.0)
            
            print(f"  [OK] PlantNet identification successful!")
            print(f"    Scientific Name: {scientific_name}")
            print(f"    Common Names: {common_names[:3]}")
            print(f"    Confidence: {confidence:.4f}")
            print(f"    Family: {species.get('family', {}).get('scientificName', 'Unknown')}")
            
            # Show top 3 results
            print(f"\n  Top 3 results:")
            for i, r in enumerate(result['results'][:3]):
                s = r.get('species', {})
                print(f"    {i+1}. {s.get('scientificName', s.get('scientificNameWithoutAuthor', 'Unknown'))} (score: {r.get('score', 0):.4f})")
            
            return True
        else:
            print(f"  [FAIL] PlantNet returned no results")
            print(f"  Full response: {json.dumps(result, indent=2)[:500]}")
            return False
            
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        return False

def test_gemini_api():
    """Test 3: Test Gemini API directly with tomato leaf image"""
    print_section("TEST 3: Gemini API Direct Test")
    
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    if not gemini_key:
        print("  [FAIL] GEMINI_API_KEY not configured - skipping")
        return False
    
    if not os.path.exists(TEST_IMAGE):
        print(f"  ✗ Test image not found: {TEST_IMAGE}")
        return False
    
    print(f"  Image: {TEST_IMAGE}")
    print(f"  Image size: {os.path.getsize(TEST_IMAGE)} bytes")
    
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
    
    try:
        # Read and encode image
        with open(TEST_IMAGE, 'rb') as f:
            image_data = f.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Test 3a: Image Validation
        print(f"\n  3a. Testing Image Validation (Gemini)...")
        prompt = """
        Analyze this image and determine if it contains a plant (leaf, flower, stem, or any plant part).
        Respond with ONLY a JSON object in this exact format:
        {
            "is_plant": true/false,
            "confidence": 0.0-1.0,
            "reason": "brief explanation"
        }
        """
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        }
        
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"  [FAIL] Gemini API error: {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False
        
        result = response.json()
        text_response = result['candidates'][0]['content']['parts'][0]['text']
        
        # Extract JSON
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            validation_data = json.loads(text_response[json_start:json_end])
            print(f"  [OK] Image validation successful!")
            print(f"    Is Plant: {validation_data.get('is_plant')}")
            print(f"    Confidence: {validation_data.get('confidence')}")
            print(f"    Reason: {validation_data.get('reason')}")
        else:
            print(f"  [FAIL] Could not parse validation response")
            print(f"  Raw response: {text_response[:300]}")
        
        # Test 3b: Plant Identification
        print(f"\n  3b. Testing Plant Identification (Gemini)...")
        prompt = """
        Identify this plant species from the image. Provide detailed information.
        Respond with ONLY a JSON object in this exact format:
        {
            "plant_name": "common name",
            "scientific_name": "scientific name",
            "family": "plant family",
            "confidence": 0.0-1.0,
            "characteristics": ["list of key identifying features"],
            "care_level": "beginner/intermediate/expert"
        }
        """
        
        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {
                        "inline_data": {
                            "mime_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }]
        }
        
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"  [FAIL] Gemini API error: {response.status_code}")
            print(f"  Response: {response.text[:500]}")
            return False
        
        result = response.json()
        text_response = result['candidates'][0]['content']['parts'][0]['text']
        
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            plant_data = json.loads(text_response[json_start:json_end])
            print(f"  [OK] Plant identification successful!")
            print(f"    Plant Name: {plant_data.get('plant_name')}")
            print(f"    Scientific Name: {plant_data.get('scientific_name')}")
            print(f"    Family: {plant_data.get('family')}")
            print(f"    Confidence: {plant_data.get('confidence')}")
            print(f"    Care Level: {plant_data.get('care_level')}")
            print(f"    Characteristics: {plant_data.get('characteristics', [])[:3]}")
        else:
            print(f"  [FAIL] Could not parse identification response")
            print(f"  Raw response: {text_response[:300]}")
        
        # Test 3c: Care Recommendations
        print(f"\n  3c. Testing Care Recommendations (Gemini)...")
        plant_name = plant_data.get('plant_name', 'tomato') if 'plant_data' in dir() else 'tomato'
        scientific_name = plant_data.get('scientific_name', 'Solanum lycopersicum') if 'plant_data' in dir() else 'Solanum lycopersicum'
        
        prompt = f"""
        Generate a comprehensive care guide for {plant_name} ({scientific_name}).
        Provide detailed recommendations in JSON format.
        """
        
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }
        
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"  Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            text_response = result['candidates'][0]['content']['parts'][0]['text']
            print(f"  [OK] Care recommendations generated!")
            print(f"  Response preview: {text_response[:200]}...")
        else:
            print(f"  [FAIL] Gemini API error: {response.status_code}")
            print(f"  Response: {response.text[:300]}")
        
        return True
        
    except Exception as e:
        print(f"  [FAIL] Exception: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_backend_health():
    """Test 4: Check backend health and config endpoints"""
    print_section("TEST 4: Backend Health & Config")
    
    # Try local backend first
    base_urls = [
        "http://127.0.0.1:8000",
        "https://aggriscan.onrender.com"
    ]
    
    for base_url in base_urls:
        print(f"\n  Testing: {base_url}")
        try:
            response = requests.get(f"{base_url}/health", timeout=10)
            print(f"  /health Status: {response.status_code}")
            if response.status_code == 200:
                print(f"  /health Response: {response.json()}")
                
                # Check config endpoint
                config_response = requests.get(f"{base_url}/health/config", timeout=10)
                print(f"  /health/config Status: {config_response.status_code}")
                if config_response.status_code == 200:
                    config = config_response.json()
                    print(f"  AI Config: {json.dumps(config.get('ai', {}), indent=4)}")
                    print(f"  SMS Config: {json.dumps(config.get('sms', {}), indent=4)}")
                    print(f"  Models: {json.dumps(config.get('models', {}), indent=4)}")
                return True
        except requests.exceptions.ConnectionError:
            print(f"  [X] Connection failed - backend not running at {base_url}")
        except requests.exceptions.Timeout:
            print(f"  [X] Timeout - backend not responding at {base_url}")
        except Exception as e:
            print(f"  [X] Error: {e}")
    
    return False

def test_analyze_plant_endpoint():
    """Test 5: Test the /analyze-plant endpoint with the tomato leaf image"""
    print_section("TEST 5: /analyze-plant Endpoint Test")
    
    if not os.path.exists(TEST_IMAGE):
        print(f"  [FAIL] Test image not found: {TEST_IMAGE}")
        return False
    
    base_urls = [
        "http://127.0.0.1:8000",
        "https://aggriscan.onrender.com"
    ]
    
    for base_url in base_urls:
        print(f"\n  Testing: {base_url}/api/v1/reports/analyze-plant")
        try:
            with open(TEST_IMAGE, 'rb') as f:
                files = {'file': ('tomato_leaf_test.jpg', f, 'image/jpeg')}
                response = requests.post(
                    f"{base_url}/api/v1/reports/analyze-plant",
                    files=files,
                    timeout=60
                )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Analysis successful!")
                print(f"  Timestamp: {result.get('timestamp')}")
                print(f"  Image Validated: {result.get('image_validated')}")
                print(f"  Plant Identified: {result.get('plant_identified')}")
                print(f"  Care Recommendations: {result.get('care_recommendations_generated')}")
                print(f"  PDF Report: {result.get('pdf_report_generated')}")
                
                if result.get('plant_identification', {}).get('success'):
                    plant_data = result['plant_identification']['plant_data']
                    print(f"\n  Plant Identification:")
                    print(f"    Service Used: {result['plant_identification'].get('service_used')}")
                    print(f"    Fallback Used: {result['plant_identification'].get('fallback_used')}")
                    print(f"    Plant Name: {plant_data.get('plant_name')}")
                    print(f"    Scientific Name: {plant_data.get('scientific_name')}")
                    print(f"    Confidence: {plant_data.get('confidence')}")
                
                if result.get('care_recommendations', {}).get('success'):
                    print(f"\n  Care Recommendations: Generated successfully")
                
                if result.get('pdf_report', {}).get('success'):
                    print(f"\n  PDF Report: {result['pdf_report'].get('report_filename')}")
                
                if result.get('summary'):
                    print(f"\n  Summary: {json.dumps(result['summary'], indent=4)}")
                
                return True
            else:
                print(f"  [X] Error: {response.text[:500]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"  [X] Connection failed - backend not running at {base_url}")
        except requests.exceptions.Timeout:
            print(f"  [X] Timeout - backend not responding at {base_url}")
        except Exception as e:
            print(f"  [X] Error: {e}")
    
    return False

def test_diagnose_endpoint():
    """Test 6: Test the /diagnose endpoint with the tomato leaf image"""
    print_section("TEST 6: /diagnose Endpoint Test (TFLite)")
    
    if not os.path.exists(TEST_IMAGE):
        print(f"  ✗ Test image not found: {TEST_IMAGE}")
        return False
    
    base_urls = [
        "http://127.0.0.1:8000",
        "https://aggriscan.onrender.com"
    ]
    
    for base_url in base_urls:
        print(f"\n  Testing: {base_url}/api/v1/reports/diagnose")
        try:
            with open(TEST_IMAGE, 'rb') as f:
                files = {'file': ('tomato_leaf_test.jpg', f, 'image/jpeg')}
                response = requests.post(
                    f"{base_url}/api/v1/reports/diagnose",
                    files=files,
                    timeout=60
                )
            
            print(f"  Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                print(f"  ✓ Diagnosis successful!")
                print(f"  Crop Type: {result.get('crop_type')}")
                print(f"  Disease Label: {result.get('disease_label')}")
                print(f"  Confidence: {result.get('confidence_score')}")
                print(f"  Severity: {result.get('severity')}")
                print(f"  Model Used: {result.get('model_used')}")
                print(f"  Detected Raw Crop: {result.get('detected_raw_crop')}")
                return True
            else:
                print(f"  [X] Error: {response.text[:500]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"  [X] Connection failed - backend not running at {base_url}")
        except requests.exceptions.Timeout:
            print(f"  [X] Timeout - backend not responding at {base_url}")
        except Exception as e:
            print(f"  [X] Error: {e}")
    
    return False

def test_report_sync_nearby_hotspots():
    """Test 7: Test report sync, nearby reports, and hotspots endpoints"""
    print_section("TEST 7: Report Sync, Nearby & Hotspots Endpoints")
    
    base_urls = [
        "http://127.0.0.1:8000",
        "https://aggriscan.onrender.com"
    ]
    
    for base_url in base_urls:
        print(f"\n  Testing: {base_url}")
        try:
            # Test health first
            health = requests.get(f"{base_url}/health", timeout=10)
            if health.status_code != 200:
                print(f"  [X] Backend not healthy at {base_url}")
                continue
            
            print(f"  ✓ Backend is healthy at {base_url}")
            
            # Test sync endpoint (requires auth - will get 401)
            print(f"\n  Testing /api/v1/reports/sync (requires auth)...")
            response = requests.post(
                f"{base_url}/api/v1/reports/sync",
                json=[],
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            print(f"  Status: {response.status_code} (expected 401 - requires auth)")
            
            # Test nearby endpoint (requires auth - will get 401)
            print(f"\n  Testing /api/v1/reports/nearby (requires auth)...")
            response = requests.get(
                f"{base_url}/api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000",
                timeout=10
            )
            print(f"  Status: {response.status_code} (expected 401 - requires auth)")
            
            # Test hotspots endpoint (requires officer/admin - will get 401)
            print(f"\n  Testing /api/v1/reports/hotspots (requires officer/admin)...")
            response = requests.get(
                f"{base_url}/api/v1/reports/hotspots",
                timeout=10
            )
            print(f"  Status: {response.status_code} (expected 401 - requires auth)")
            
            # Test auth endpoints
            print(f"\n  Testing /api/v1/auth/login (seeded user)...")
            response = requests.post(
                f"{base_url}/api/v1/auth/login",
                json={"phone_number": "+256700000001", "password": "Password123"},
                timeout=10
            )
            print(f"  Status: {response.status_code}")
            if response.status_code == 200:
                token_data = response.json()
                token = token_data.get('access_token', '')
                print(f"  ✓ Login successful! Token received (length: {len(token)})")
                
                # Now test authenticated endpoints
                headers = {"Authorization": f"Bearer {token}"}
                
                # Test sync with a sample report
                print(f"\n  Testing /api/v1/reports/sync with sample data...")
                sample_report = [{
                    "crop_type": "Tomato",
                    "disease_label": "Tomato_Early_Blight",
                    "confidence_score": 0.85,
                    "latitude": 0.3476,
                    "longitude": 32.5825,
                    "severity": "High",
                    "offline_created_at": "2026-05-08T10:00:00Z",
                    "image_url": None
                }]
                response = requests.post(
                    f"{base_url}/api/v1/reports/sync",
                    json=sample_report,
                    headers=headers,
                    timeout=10
                )
                print(f"  Status: {response.status_code}")
                if response.status_code == 201:
                    result = response.json()
                    print(f"  ✓ Sync successful! Created {len(result)} report(s)")
                    if result:
                        print(f"  Report ID: {result[0].get('id')}")
                        print(f"  Crop Type: {result[0].get('crop_type')}")
                        print(f"  Disease: {result[0].get('disease_label')}")
                        print(f"  Location: {result[0].get('latitude')}, {result[0].get('longitude')}")
                
                # Test nearby reports
                print(f"\n  Testing /api/v1/reports/nearby...")
                response = requests.get(
                    f"{base_url}/api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000",
                    headers=headers,
                    timeout=10
                )
                print(f"  Status: {response.status_code}")
                if response.status_code == 200:
                    nearby = response.json()
                    print(f"  ✓ Found {len(nearby)} nearby reports")
                    for r in nearby[:3]:
                        print(f"    - {r.get('crop_type')}: {r.get('disease_label')} at ({r.get('latitude')}, {r.get('longitude')})")
                
                # Test hotspots
                print(f"\n  Testing /api/v1/reports/hotspots...")
                response = requests.get(
                    f"{base_url}/api/v1/reports/hotspots?radius_meters=2000&threshold_count=1",
                    headers=headers,
                    timeout=10
                )
                print(f"  Status: {response.status_code}")
                if response.status_code == 200:
                    hotspots = response.json()
                    print(f"  ✓ Found {len(hotspots)} hotspots")
                    for h in hotspots[:3]:
                        print(f"    - {h.get('crop_type')}: {h.get('disease_label')} at ({h.get('latitude')}, {h.get('longitude')}) count={h.get('outbreak_count')}")
                
                return True
            else:
                print(f"  [X] Login failed: {response.text[:300]}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"  [X] Connection failed - backend not running at {base_url}")
        except requests.exceptions.Timeout:
            print(f"  [X] Timeout - backend not responding at {base_url}")
        except Exception as e:
            print(f"  [X] Error: {e}")
            import traceback
            traceback.print_exc()
    
    return False

def main():
    print("=" * 70)
    print("  AGRI-SCAN API TEST SUITE")
    print("  Testing PlantNet, Gemini APIs and Backend Endpoints")
    print(f"  Test Image: {TEST_IMAGE}")
    print("=" * 70)
    
    results = []
    
    # Test 1: Environment Configuration
    config = test_env_config()
    results.append(("Environment Configuration", config))
    
    # Test 2: PlantNet API
    plantnet_ok = test_plantnet_api()
    results.append(("PlantNet API", plantnet_ok))
    
    # Test 3: Gemini API
    gemini_ok = test_gemini_api()
    results.append(("Gemini API", gemini_ok))
    
    # Test 4: Backend Health
    health_ok = test_backend_health()
    results.append(("Backend Health & Config", health_ok))
    
    # Test 5: Analyze Plant Endpoint
    analyze_ok = test_analyze_plant_endpoint()
    results.append(("Analyze Plant Endpoint", analyze_ok))
    
    # Test 6: Diagnose Endpoint
    diagnose_ok = test_diagnose_endpoint()
    results.append(("Diagnose Endpoint", diagnose_ok))
    
    # Test 7: Report Sync, Nearby, Hotspots
    reports_ok = test_report_sync_nearby_hotspots()
    results.append(("Report Sync, Nearby & Hotspots", reports_ok))
    
    # Summary
    print_section("TEST SUMMARY")
    passed = 0
    total = len(results)
    for name, result in results:
        if isinstance(result, dict):
            status = "[PASS]" if all(result.values()) else "[PARTIAL]"
        else:
            status = "[PASS]" if result else "[FAIL]"
        print(f"  {status}: {name}")
        if result or (isinstance(result, dict) and any(result.values())):
            passed += 1
    
    print(f"\n  Total: {passed}/{total} test groups passed")
    
    if passed == total:
        print("\n  [PASS] All tests passed! APIs and backend are fully functional.")
    else:
        print(f"\n  [!] {total - passed} test group(s) had issues. Review the output above.")

if __name__ == '__main__':
    main()
