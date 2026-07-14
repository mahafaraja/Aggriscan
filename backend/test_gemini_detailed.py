import os
import sys
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import requests
import base64
import numpy as np
from PIL import Image


def test_gemini_api_directly():
    """Test Gemini API directly to see the full error response"""
    
    print("=" * 60)
    print("GEMINI API DIAGNOSTIC TEST")
    print("=" * 60)
    
    # Check API key
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    print(f"\n1. API Key Status:")
    print(f"   Present: {bool(gemini_key)}")
    print(f"   Key (first 10 chars): {gemini_key[:10]}..." if gemini_key else "   Key: NOT SET")
    
    if not gemini_key:
        print("\n❌ ERROR: GEMINI_API_KEY not found in .env file")
        return
    
    # Create test image
    print(f"\n2. Creating test image...")
    temp_img_path = 'temp_gemini_detailed_test.jpg'
    img = np.random.randint(0, 255, size=(224, 224, 3), dtype=np.uint8)
    img[:, :, 1] = 200  # Make it green-ish
    Image.fromarray(img).save(temp_img_path)
    print(f"   Created: {temp_img_path}")
    
    # Read and encode image
    with open(temp_img_path, 'rb') as f:
        image_data = f.read()
    base64_image = base64.b64encode(image_data).decode('utf-8')
    
    # Prepare request
    gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}"
    
    prompt = """
    Analyze this image and determine if it contains a plant.
    Respond with ONLY a JSON object:
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
    
    print(f"\n3. Making API request...")
    print(f"   URL: {gemini_url[:60]}...")
    
    try:
        response = requests.post(
            gemini_url,
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30
        )
        
        print(f"\n4. Response received:")
        print(f"   Status Code: {response.status_code}")
        print(f"   Status Meaning: {get_status_meaning(response.status_code)}")
        
        # Print full response for debugging
        print(f"\n5. Full Response:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2))
        except:
            print(f"   Raw response: {response.text}")
        
        # Check for specific error types
        if response.status_code == 429:
            print(f"\n❌ RATE LIMIT ERROR (429)")
            print(f"   Possible causes:")
            print(f"   - API key has exceeded quota/rate limit")
            print(f"   - Free tier limit reached")
            print(f"   - Billing not enabled on Google Cloud project")
            print(f"\n   Solutions:")
            print(f"   1. Check Google AI Studio quota: https://aistudio.google.com/app/apikey")
            print(f"   2. Enable billing on Google Cloud project")
            print(f"   3. Wait for rate limit to reset (usually 1 minute)")
            print(f"   4. Upgrade to paid tier")
        
        elif response.status_code == 400:
            print(f"\n❌ BAD REQUEST ERROR (400)")
            print(f"   Possible causes:")
            print(f"   - Invalid API key format")
            print(f"   - Request payload malformed")
            print(f"   - Model name incorrect")
        
        elif response.status_code == 403:
            print(f"\n❌ FORBIDDEN ERROR (403)")
            print(f"   Possible causes:")
            print(f"   - API key invalid or expired")
            print(f"   - API not enabled in Google Cloud project")
            print(f"   - Permission denied")
        
        elif response.status_code == 200:
            print(f"\n✅ SUCCESS!")
            result = response.json()
            if 'candidates' in result:
                text_response = result['candidates'][0]['content']['parts'][0]['text']
                print(f"   Response: {text_response}")
        
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
    
    finally:
        # Cleanup
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
            print(f"\n6. Cleaned up test image")


def get_status_meaning(status_code):
    """Return human-readable meaning of HTTP status code"""
    meanings = {
        200: "OK - Request successful",
        400: "Bad Request - Invalid request",
        401: "Unauthorized - Missing/invalid API key",
        403: "Forbidden - Permission denied",
        404: "Not Found - Resource not found",
        429: "Too Many Requests - Rate limit exceeded",
        500: "Internal Server Error - Google server error",
        503: "Service Unavailable - Service temporarily down"
    }
    return meanings.get(status_code, "Unknown status code")


if __name__ == '__main__':
    test_gemini_api_directly()