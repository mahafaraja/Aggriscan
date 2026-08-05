"""
Test script for rule-based care recommendations system.
Tests that care guides work without Gemini API.
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.plant_identification import CareRecommendationService

def test_care_rules():
    """Test rule-based care recommendations"""
    print("=" * 70)
    print("  TEST: Rule-Based Care Recommendations")
    print("=" * 70)
    
    # Initialize service with empty Gemini key (simulating quota exceeded)
    service = CareRecommendationService(gemini_api_key="")
    
    # Test cases for different crops and diseases
    test_cases = [
        {
            "plant_data": {
                "plant_name": "Garden Tomato",
                "scientific_name": "Solanum lycopersicum L."
            },
            "disease_info": {
                "disease_label": "Tomato_Septoria_Leaf_Spot"
            },
            "expected_crop": "tomato"
        },
        {
            "plant_data": {
                "plant_name": "Maize",
                "scientific_name": "Zea mays"
            },
            "disease_info": {
                "disease_label": "Maize___Blight"
            },
            "expected_crop": "maize"
        },
        {
            "plant_data": {
                "plant_name": "Banana",
                "scientific_name": "Musa spp."
            },
            "disease_info": {
                "disease_label": "Banana_BBW"
            },
            "expected_crop": "banana"
        },
        {
            "plant_data": {
                "plant_name": "Potato",
                "scientific_name": "Solanum tuberosum"
            },
            "disease_info": {
                "disease_label": "Potato_Late_Blight"
            },
            "expected_crop": "potato"
        },
        {
            "plant_data": {
                "plant_name": "Cassava",
                "scientific_name": "Manihot esculenta"
            },
            "disease_info": {
                "disease_label": "Cassava_CMD"
            },
            "expected_crop": "cassava"
        }
    ]
    
    results = []
    for i, test_case in enumerate(test_cases, 1):
        print(f"\nTest {i}: {test_case['plant_data']['plant_name']} - {test_case['disease_info']['disease_label']}")
        print("-" * 70)
        
        result = service.generate_care_guide(
            test_case['plant_data'],
            test_case['disease_info']
        )
        
        if result.get('success'):
            care_guide = result.get('care_guide', {})
            disease_info = care_guide.get('disease_info', {})
            
            print(f"[OK] Care guide generated successfully!")
            print(f"  Disease: {disease_info.get('name', 'N/A')}")
            print(f"  Severity: {disease_info.get('severity', 'N/A')}")
            print(f"  Source: {care_guide.get('source', 'N/A')}")
            print(f"  Symptoms: {len(disease_info.get('symptoms', []))} items")
            print(f"  Immediate Actions: {len(disease_info.get('immediate_actions', []))} items")
            print(f"  Prevention: {len(care_guide.get('prevention', []))} items")
            
            treatment = care_guide.get('treatment', {})
            print(f"  Chemical Treatments: {len(treatment.get('chemical', []))} items")
            print(f"  Organic Treatments: {len(treatment.get('organic', []))} items")
            
            results.append(True)
        else:
            print(f"[FAIL] Care guide generation failed: {result.get('error')}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 70)
    print("  TEST SUMMARY")
    print("=" * 70)
    passed = sum(results)
    total = len(results)
    print(f"  Passed: {passed}/{total}")
    
    if passed == total:
        print("\n[SUCCESS] All care rules working correctly!")
        print("The app can now generate care recommendations WITHOUT Gemini API!")
    else:
        print(f"\n[WARNING] {total - passed} test(s) failed")
    
    print("=" * 70)
    
    return passed == total

if __name__ == '__main__':
    success = test_care_rules()
    sys.exit(0 if success else 1)