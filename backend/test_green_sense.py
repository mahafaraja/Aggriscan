"""
Test script to verify Green-Sense integration
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Test that all Green-Sense services can be imported"""
    print("Testing backend imports...")
    try:
        from app.services.plant_identification import (
            get_image_validation_service,
            get_plant_identification_service,
            get_care_recommendation_service,
            get_pdf_report_generator
        )
        print("✓ All Green-Sense services imported successfully")
        return True
    except Exception as e:
        print(f"✗ Import failed: {e}")
        return False

def test_services_initialization():
    """Test that services can be initialized"""
    print("\nTesting service initialization...")
    try:
        from app.services.plant_identification import (
            get_image_validation_service,
            get_plant_identification_service,
            get_care_recommendation_service,
            get_pdf_report_generator
        )
        
        # Initialize services
        validation_service = get_image_validation_service()
        print("✓ Image validation service initialized")
        
        identification_service = get_plant_identification_service()
        print("✓ Plant identification service initialized")
        
        care_service = get_care_recommendation_service()
        print("✓ Care recommendation service initialized")
        
        pdf_service = get_pdf_report_generator()
        print("✓ PDF report generator initialized")
        
        return True
    except Exception as e:
        print(f"✗ Service initialization failed: {e}")
        return False

def test_api_endpoint():
    """Test that the API endpoint is properly configured"""
    print("\nTesting API endpoint configuration...")
    try:
        from app.routers import reports
        
        # Check if the router has the analyze-plant endpoint
        router_routes = [route.path for route in reports.router.routes]
        if "/api/v1/reports/analyze-plant" in router_routes:
            print("✓ analyze-plant endpoint registered in router")
            return True
        else:
            print("✗ analyze-plant endpoint not found in router")
            print(f"  Available routes: {router_routes}")
            return False
    except Exception as e:
        print(f"✗ API endpoint test failed: {e}")
        return False

def test_model_assets():
    """Test that model assets are accessible"""
    print("\nTesting model assets...")
    try:
        model_dir = os.path.join(os.path.dirname(__file__), "app", "model_assets")
        
        # Check if model directory exists
        if not os.path.exists(model_dir):
            print(f"✗ Model directory not found: {model_dir}")
            return False
        
        # Check for class map
        class_map_path = os.path.join(model_dir, "class_map.json")
        if os.path.exists(class_map_path):
            print(f"✓ Class map found: {class_map_path}")
        else:
            print(f"⚠ Class map not found: {class_map_path}")
        
        # Check for TFLite model
        tflite_path = os.path.join(model_dir, "agriscan_model.tflite")
        if os.path.exists(tflite_path):
            print(f"✓ TFLite model found: {tflite_path}")
        else:
            print(f"⚠ TFLite model not found: {tflite_path}")
        
        return True
    except Exception as e:
        print(f"✗ Model assets test failed: {e}")
        return False

def test_environment_variables():
    """Test that required environment variables are set"""
    print("\nTesting environment variables...")
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key and gemini_key != "your_plantid_api_key_here":
            print(f"✓ GEMINI_API_KEY is set (length: {len(gemini_key)})")
        else:
            print("⚠ GEMINI_API_KEY not set or using placeholder")
        
        plantid_key = os.getenv("PLANTID_API_KEY")
        if plantid_key and plantid_key != "your_plantid_api_key_here":
            print(f"✓ PLANTID_API_KEY is set")
        else:
            print("⚠ PLANTID_API_KEY not set (optional)")
        
        plantnet_key = os.getenv("PLANTNET_API_KEY")
        if plantnet_key and plantnet_key != "your_plantnet_api_key_here":
            print(f"✓ PLANTNET_API_KEY is set")
        else:
            print("⚠ PLANTNET_API_KEY not set (optional)")
        
        return True
    except Exception as e:
        print(f"✗ Environment variables test failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Green-Sense Integration Test Suite")
    print("=" * 60)
    
    results = []
    
    results.append(("Imports", test_imports()))
    results.append(("Service Initialization", test_services_initialization()))
    results.append(("API Endpoint", test_api_endpoint()))
    results.append(("Model Assets", test_model_assets()))
    results.append(("Environment Variables", test_environment_variables()))
    
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All tests passed! Green-Sense integration is ready.")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Please review the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())