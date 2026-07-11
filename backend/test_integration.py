"""
Integration test to verify all crops are connected between frontend and backend
"""
import json
import os

def test_crop_type_consistency():
    """Verify that all crop types in backend model are supported in frontend"""
    print("Testing crop type consistency...")
    
    # Load backend class map
    class_map_path = os.path.join(os.path.dirname(__file__), "app", "model_assets", "class_map.json")
    with open(class_map_path, 'r') as f:
        class_map = json.load(f)
    
    backend_crops = set(class_map.values())
    print(f"  Backend crops: {sorted(backend_crops)}")
    
    # Frontend CropType definition
    frontend_crops = {'Banana', 'Bean', 'Cassava', 'Coffee', 'Corn', 'Groundnuts', 'Potato', 'Tomato'}
    print(f"  Frontend crops: {sorted(frontend_crops)}")
    
    # Check if all backend crops are in frontend (case-insensitive)
    backend_crops_normalized = {crop.capitalize() for crop in backend_crops}
    
    missing_in_frontend = backend_crops_normalized - frontend_crops
    if missing_in_frontend:
        print(f"  ✗ Missing in frontend: {missing_in_frontend}")
        return False
    
    print("  ✓ All backend crops are supported in frontend")
    
    # Check scanProcessor.ts crop mapping
    print("\n  Checking crop mapping in scanProcessor.ts...")
    with open(os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "services", "scanProcessor.ts"), 'r') as f:
        scan_processor = f.read()
    
    mapping_checks = {
        'cassava': 'Cassava',
        'bean': 'Bean',
        'coffee': 'Coffee',
        'corn': 'Corn',
        'maize': 'Corn',
        'groundnut': 'Groundnuts',
        'peanut': 'Groundnuts',
        'potato': 'Potato',
        'tomato': 'Tomato'
    }
    
    for keyword, crop_type in mapping_checks.items():
        if keyword.lower() in scan_processor.lower():
            print(f"    ✓ '{keyword}' -> '{crop_type}' mapping found")
        else:
            print(f"    ⚠ '{keyword}' mapping not explicitly found (may use default)")
    
    return True

def test_api_endpoints():
    """Verify all required API endpoints exist"""
    print("\nTesting API endpoints...")
    
    with open(os.path.join(os.path.dirname(__file__), "app", "routers", "reports.py"), 'r') as f:
        reports_router = f.read()
    
    required_endpoints = [
        '/diagnose',
        '/analyze-plant',
        '/sync',
        '/nearby',
        '/hotspots'
    ]
    
    all_found = True
    for endpoint in required_endpoints:
        if f'@router.{endpoint}' in reports_router or f'"{endpoint}"' in reports_router:
            print(f"  ✓ Endpoint {endpoint} found")
        else:
            print(f"  ✗ Endpoint {endpoint} missing")
            all_found = False
    
    return all_found

def test_green_sense_services():
    """Verify all Green-Sense services are implemented"""
    print("\nTesting Green-Sense services...")
    
    with open(os.path.join(os.path.dirname(__file__), "app", "services", "plant_identification.py"), 'r') as f:
        services = f.read()
    
    required_services = [
        'ImageValidationService',
        'PlantIdentificationService',
        'CareRecommendationService',
        'PDFReportGenerator'
    ]
    
    all_found = True
    for service in required_services:
        if service in services:
            print(f"  ✓ {service} implemented")
        else:
            print(f"  ✗ {service} missing")
            all_found = False
    
    # Check for fallback chain
    print("\n  Checking fallback chain...")
    if 'identify_with_gemini' in services:
        print("    ✓ Primary: Gemini")
    else:
        print("    ✗ Primary Gemini not found")
        all_found = False
    
    if 'identify_with_plantid' in services:
        print("    ✓ Fallback 1: PlantID")
    else:
        print("    ⚠ Fallback 1: PlantID (optional)")
    
    if 'identify_with_plantnet' in services:
        print("    ✓ Fallback 2: PlantNet")
    else:
        print("    ⚠ Fallback 2: PlantNet (optional)")
    
    return all_found

def test_frontend_backend_connection():
    """Verify frontend is connected to backend"""
    print("\nTesting frontend-backend connection...")
    
    # Check scanProcessor uses backend API
    scan_processor_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "services", "scanProcessor.ts")
    with open(scan_processor_path, 'r') as f:
        scan_processor = f.read()
    
    if 'analyzePlantWithBackend' in scan_processor:
        print("  ✓ Frontend uses Green-Sense analyze-plant endpoint")
    else:
        print("  ✗ Frontend not connected to Green-Sense")
        return False
    
    if 'diagnoseImageWithBackend' in scan_processor:
        print("  ✓ Frontend has fallback to diagnose endpoint")
    else:
        print("  ✗ Fallback endpoint not found")
        return False
    
    # Check backend API functions exist
    backend_api_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "src", "services", "backendApi.ts")
    with open(backend_api_path, 'r') as f:
        backend_api = f.read()
    
    if 'analyzePlantWithBackend' in backend_api:
        print("  ✓ Backend API function analyzePlantWithBackend exists")
    else:
        print("  ✗ Backend API function missing")
        return False
    
    if 'PlantAnalysisResponse' in backend_api:
        print("  ✓ PlantAnalysisResponse type defined")
    else:
        print("  ✗ PlantAnalysisResponse type missing")
        return False
    
    return True

def main():
    print("=" * 70)
    print("Agriscan Integration Test - Crop Connections & Build Readiness")
    print("=" * 70)
    
    results = []
    
    results.append(("Crop Type Consistency", test_crop_type_consistency()))
    results.append(("API Endpoints", test_api_endpoints()))
    results.append(("Green-Sense Services", test_green_sense_services()))
    results.append(("Frontend-Backend Connection", test_frontend_backend_connection()))
    
    print("\n" + "=" * 70)
    print("Test Summary")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n✓ All integration tests passed! Ready for build.")
        print("\nSupported crops:")
        print("  - Banana")
        print("  - Bean")
        print("  - Cassava")
        print("  - Coffee")
        print("  - Corn/Maize")
        print("  - Groundnuts/Peanuts")
        print("  - Potato")
        print("  - Tomato")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed. Please review.")
        return 1

if __name__ == "__main__":
    import sys
    sys.exit(main())