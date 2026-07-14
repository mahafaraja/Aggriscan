import os
import sys
import numpy as np
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.plant_identification import get_image_validation_service, get_plant_identification_service


def main():
    print("1. Loading environment variables from .env if present")
    # Ensure GEMINI_API_KEY is present
    gemini_key = os.getenv('GEMINI_API_KEY', '')
    print(f"GEMINI_API_KEY present: {bool(gemini_key)}")

    print("\n2. Creating synthetic test image...")
    temp_img_path = 'temp_gemini_test.jpg'
    img = np.random.randint(0, 255, size=(224, 224, 3), dtype=np.uint8)
    img[:, :, 1] = 200
    Image.fromarray(img).save(temp_img_path)

    try:
        print("\n3. Testing Image Validation (Gemini primary)")
        val_service = get_image_validation_service()
        val_result = val_service.validate_plant_image(temp_img_path)
        print("Validation result:", val_result)

        print("\n4. Testing Plant Identification (Gemini primary, fallbacks)")
        id_service = get_plant_identification_service()
        id_result = id_service.identify_plant(temp_img_path)
        print("Identification result:", id_result)

    except Exception as e:
        print(f"Error during Gemini tests: {e}")
        sys.exit(1)
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)

    print("\nGemini test script completed.")

if __name__ == '__main__':
    main()
