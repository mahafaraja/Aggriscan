import os
import sys
import numpy as np
from PIL import Image

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, Base
from app.services.inference import get_inference_service

def main():
    print("1. Creating database tables if they do not exist...")
    try:
        Base.metadata.create_all(bind=engine)
        print("Database tables initialized successfully!")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        sys.exit(1)
        
    print("\n2. Initializing inference service...")
    try:
        service = get_inference_service()
        print("Inference service initialized successfully!")
    except Exception as e:
        print(f"Error initializing inference service: {e}")
        sys.exit(1)
        
    print("\n3. Running test prediction on synthetic image...")
    temp_img_path = "temp_test_image.jpg"
    try:
        # Create a mock green image
        img = np.random.randint(0, 255, size=(224, 224, 3), dtype=np.uint8)
        # Add some extra green to make it "healthy"
        img[:, :, 1] = 200 
        
        Image.fromarray(img).save(temp_img_path)
        
        result = service.predict_crop(temp_img_path)
        print("Prediction result:")
        print(result)
        
        # Verify result contains expected keys
        assert "crop_type" in result
        assert "disease_label" in result
        assert "confidence_score" in result
        assert "severity" in result
        print("Prediction keys verification passed!")
    except Exception as e:
        print(f"Error running test prediction: {e}")
        sys.exit(1)
    finally:
        if os.path.exists(temp_img_path):
            os.remove(temp_img_path)
            
    print("\nAll tests passed successfully!")

if __name__ == "__main__":
    main()
