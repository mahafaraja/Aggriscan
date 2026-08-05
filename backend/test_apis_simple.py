"""
Simple test script for PlantNet and Gemini APIs.
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

# Test image path
TEST_IMAGE = r"C:\Users\mahaf\Downloads\tomato_leaf_test.jpg"

def test_plantnet_api():
    """Test PlantNet API directly"""
    print("=" * 70)
    print("  TEST: PlantNet API")
    print("=" * 70)
    
    plantnet_key = os.getenv('PLANTNET_API_KEY', '')
    if not plantnet_key:
        print("[FAIL] PLANTNET_API_KEY not configured")
        return False
    
    if not os.path.exists(TEST_IMAGE):
        print(f"[FAIL] Test image not found: {TEST_IMAGE}")
        return False
    
    print(f"Image: {TEST_IMAGE}")
    print(f"Image size: {os.path.getsize(TEST_IMAGE)} bytes")
    
    # PlantNet API endpoint
    plantnet_url = "https://my-api.plantnet.org/v2/identify/all"
    
    try:
        # Convert image to JPEG
        from PIL import Image
        import io
        
        img = Image.open(TEST_IMAGE).convert('RGB')
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='JPEG', quality=95)
        img_buffer.seek(0)
        
        files = {'images': ('image.jpg', img_buffer, 'image/jpeg')}
        data = {'organs': 'leaf'}
        headers = {'Authorization': f"Bearer {plantnet_key}"}
        
        print("Sending request to PlantNet API...")
        response = requests.post(
            plantnet_url,
            files=files,
            data=data,
            headers=headers,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code != 200:
            print(f"[FAIL] PlantNet API error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
        
        result = response.json()
        
        if result.get('results') and len(result['results']) > 0:
            best_match = result['results'][0]
            species = best_match.get('species', {})
            common_names = species.get('commonNames', [])
            scientific_name = species.get('scientificName', species.get('scientificNameWithoutAuthor', 'Unknown'))
            confidence = best_match.get('score', 0.0)
            
            print("[OK] PlantNet identification successful!")
            print(f"  Scientific Name: {scientific_name}")
            print(f"  Common Names: {common_names[:3]}")
            print(f"  Confidence: {confidence:.4f}")
            print(f"  Family: {species.get('family', {}).get('scientificName', 'Unknown')}")
            
            return True
        else:
            print("[FAIL] PlantNet returned no results")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False

def test_gemini_api():
    """Test Gemini API directly"""
    print("\n" + "=" * 70)
    print("  TEST: Gemini API")
    print("=" * 70)
    
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    if not gemini_key:
        print("[FAIL] GEMINI_API_KEY not configured")
        return False
    
    if not os.path.exists(TEST_IMAGE):
        print(f"[FAIL] Test image not found: {TEST_IMAGE}")
        return False
    
    print(f"Image: {TEST_IMAGE}")
    print(f"Image size: {os.path.getsize(TEST_IMAGE)} bytes")
    
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
    
    try:
        # Read and encode image
        with open(TEST_IMAGE, 'rb') as f:
            image_data = f.read()
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Test Image Validation
        print("\nTesting Image Validation (Gemini)...")
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
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 429:
            print("[FAIL] Gemini API quota exceeded (429)")
            print("This is expected for free tier - quota limits reached")
            return False
        
        if response.status_code != 200:
            print(f"[FAIL] Gemini API error: {response.status_code}")
            print(f"Response: {response.text[:500]}")
            return False
        
        result = response.json()
        text_response = result['candidates'][0]['content']['parts'][0]['text']
        
        # Extract JSON
        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        if json_start != -1 and json_end > json_start:
            validation_data = json.loads(text_response[json_start:json_end])
            print("[OK] Image validation successful!")
            print(f"  Is Plant: {validation_data.get('is_plant')}")
            print(f"  Confidence: {validation_data.get('confidence')}")
            print(f"  Reason: {validation_data.get('reason')}")
            return True
        else:
            print("[FAIL] Could not parse validation response")
            return False
            
    except Exception as e:
        print(f"[FAIL] Exception: {e}")
        return False

def main():
    print("\n" + "=" * 70)
    print("  AGRI-SCAN API TEST - SIMPLE VERSION")
    print("  Testing PlantNet and Gemini APIs")
    print(f"  Test Image: {TEST_IMAGE}")
    print("=" * 70)
    
    # Test PlantNet
    plantnet_ok = test_plantnet_api()
    
    # Test Gemini
    gemini_ok = test_gemini_api()
    
    # Summary
    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    print(f"  PlantNet API: {'[PASS]' if plantnet_ok else '[FAIL]'}")
    print(f"  Gemini API: {'[PASS]' if gemini_ok else '[FAIL]'}")
    print(f"\n  Result: {'All tests passed!' if (plantnet_ok and gemini_ok) else 'Some tests failed'}")
    print("=" * 70)

if __name__ == '__main__':
    main()