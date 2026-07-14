"""
Test script to evaluate maize_disease_expert.tflite performance
"""
import os
import sys
import numpy as np
from PIL import Image
import tensorflow as tf

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_test_image():
    """Create a synthetic test image"""
    img = np.random.randint(0, 255, size=(224, 224, 3), dtype=np.uint8)
    return Image.fromarray(img)

def test_maize_disease_expert():
    """Test the maize disease expert model"""
    print("=" * 60)
    print("MAIZE DISEASE EXPERT MODEL TEST")
    print("=" * 60)
    
    # Model paths
    model_dir = os.path.join(os.path.dirname(__file__), "app", "model_assets")
    maize_expert_path = os.path.join(model_dir, "maize_disease_expert.tflite")
    maize_model_path = os.path.join(model_dir, "maize_model", "maize_model.tflite")
    maize_class_map_path = os.path.join(model_dir, "maize_model", "class_map.json")
    
    print(f"\n1. Checking model files...")
    print(f"   maize_disease_expert.tflite exists: {os.path.exists(maize_expert_path)}")
    if os.path.exists(maize_expert_path):
        size_mb = os.path.getsize(maize_expert_path) / (1024 * 1024)
        print(f"   Size: {size_mb:.2f} MB")
    
    print(f"   maize_model.tflite exists: {os.path.exists(maize_model_path)}")
    print(f"   class_map.json exists: {os.path.exists(maize_class_map_path)}")
    
    # Load class map
    if not os.path.exists(maize_class_map_path):
        print("\n❌ ERROR: Class map not found!")
        return
    
    with open(maize_class_map_path, 'r') as f:
        class_map = json.load(f)
    
    print(f"\n2. Class map loaded:")
    for idx, label in class_map.items():
        print(f"   {idx}: {label}")
    
    # Test maize_disease_expert model
    if not os.path.exists(maize_expert_path):
        print("\n⚠️  maize_disease_expert.tflite not found, skipping test")
        return
    
    print(f"\n3. Loading maize_disease_expert.tflite...")
    try:
        interpreter = tf.lite.Interpreter(model_path=maize_expert_path)
        interpreter.allocate_tensors()
        
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        print(f"   ✅ Model loaded successfully")
        print(f"   Input shape: {input_details[0]['shape']}")
        print(f"   Input dtype: {input_details[0]['dtype']}")
        
        # Create test image
        print(f"\n4. Running inference on synthetic image...")
        img = create_test_image()
        img = img.resize((input_details[0]['shape'][1], input_details[0]['shape'][2]))
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0
        
        # Run inference
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        
        output_data = interpreter.get_tensor(output_details[0]['index'])[0]
        pred_idx = int(np.argmax(output_data))
        confidence = float(output_data[pred_idx])
        
        predicted_class = class_map[str(pred_idx)]
        
        print(f"\n5. Results:")
        print(f"   Predicted class: {predicted_class}")
        print(f"   Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
        print(f"   Model: maize_disease_expert.tflite")
        
        # Show top 3 predictions
        print(f"\n6. Top 3 predictions:")
        top_indices = np.argsort(output_data)[-3:][::-1]
        for i, idx in enumerate(top_indices, 1):
            class_name = class_map[str(idx)]
            prob = output_data[idx]
            print(f"   {i}. {class_name}: {prob:.4f} ({prob*100:.2f}%)")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    import json
    test_maize_disease_expert()