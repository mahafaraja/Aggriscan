import os
import json
import numpy as np
from PIL import Image
import tensorflow as tf

class CropInferenceService:
    def __init__(self):
        # Determine path to assets relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = os.path.join(os.path.dirname(current_dir), "model_assets")
        
        # Model paths
        self.gatekeeper_model_path = os.path.join(self.model_dir, "mobilenetv2_crop_gatekeeper.tflite")
        self.agriscan_model_path = os.path.join(self.model_dir, "agriscan_model.tflite")
        
        # Disease expert models mapping
        self.disease_expert_models = {
            "coffee": os.path.join(self.model_dir, "coffe_model", "coffee_model.tflite"),
            "maize": os.path.join(self.model_dir, "maize_disease_expert.tflite"),  # Using disease expert instead of general model
            "banana": os.path.join(self.model_dir, "banana_disease_expert.tflite"),
            "bean": os.path.join(self.model_dir, "bean_disease_expert.tflite"),
            "cassava": os.path.join(self.model_dir, "cassava_disease_expert.tflite"),
            "groundnuts": os.path.join(self.model_dir, "groundnuts_disease_expert.tflite"),
            "potato": os.path.join(self.model_dir, "potato_disease_expert.tflite"),
            "tomato": os.path.join(self.model_dir, "tomato_disease_expert.tflite"),
        }
        
        # Load gatekeeper model for crop type detection (primary)
        self.gatekeeper_interpreter = None
        self.gatekeeper_class_map = None
        if os.path.exists(self.gatekeeper_model_path):
            self.gatekeeper_interpreter = self._load_model(self.gatekeeper_model_path)
            self.gatekeeper_class_map = self._load_class_map(os.path.join(self.model_dir, "class_map.json"))
            print(f"✅ Gatekeeper model loaded: mobilenetv2_crop_gatekeeper.tflite")
        
        # Load agriscan model as final fallback
        self.agriscan_interpreter = None
        self.agriscan_class_map = None
        if os.path.exists(self.agriscan_model_path):
            self.agriscan_interpreter = self._load_model(self.agriscan_model_path)
            self.agriscan_class_map = self._load_class_map(os.path.join(self.model_dir, "class_map.json"))
            print(f"✅ Fallback model loaded: agriscan_model.tflite")
        
        # Cache for loaded disease expert models
        self.disease_model_cache = {}
        
        print(f"✅ CropInferenceService initialized with {len(self.disease_expert_models)} disease expert models")

    def _load_model(self, model_path: str):
        """Load a TFLite model and allocate tensors"""
        if not os.path.exists(model_path):
            return None
        interpreter = tf.lite.Interpreter(model_path=model_path)
        interpreter.allocate_tensors()
        return interpreter
    
    def _load_class_map(self, class_map_path: str):
        """Load class map from JSON file"""
        if not os.path.exists(class_map_path):
            return None
        with open(class_map_path, "r") as f:
            return json.load(f)
    
    def _preprocess_image(self, image_path: str, input_shape):
        """Load and preprocess image for inference"""
        img = Image.open(image_path).convert('RGB')
        img = img.resize((input_shape[1], input_shape[2]))
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)
        img_array = img_array / 255.0  # Normalize to [0, 1]
        return img_array
    
    def _run_inference(self, interpreter, img_array):
        """Run inference on a TFLite model"""
        input_details = interpreter.get_input_details()
        output_details = interpreter.get_output_details()
        
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        
        output_data = interpreter.get_tensor(output_details[0]['index'])[0]
        pred_idx = int(np.argmax(output_data))
        confidence = float(output_data[pred_idx])
        
        return pred_idx, confidence
    
    def predict_crop(self, image_path: str):
        """
        Loads an image, preprocesses it, runs inference, and returns predicted crop type,
        confidence score, mapped disease labels, and severity.
        
        Enhanced fallback chain:
        1. Try gatekeeper model (MobileNetV2) for crop type
        2. Try disease expert model for specific crop
        3. Fallback to agriscan_model
        """
        # Strategy 1: Use gatekeeper model + disease expert model
        if self.gatekeeper_interpreter and self.gatekeeper_class_map:
            try:
                img_array = self._preprocess_image(image_path, self.gatekeeper_interpreter.get_input_details()[0]['shape'])
                pred_idx, confidence = self._run_inference(self.gatekeeper_interpreter, img_array)
                crop_name = self.gatekeeper_class_map[str(pred_idx)]
                
                # Extract crop type (e.g., "Tomato___Early_Blight" -> "Tomato")
                crop_type = crop_name.split("_")[0] if "_" in crop_name else crop_name
                
                # Try to use disease expert model for this crop
                disease_result = self._predict_with_disease_expert(image_path, crop_type.lower())
                if disease_result:
                    return disease_result
                
                # If no disease expert, use gatekeeper result
                disease_label = crop_name
                severity = "High" if confidence > 0.8 else "Medium" if confidence > 0.5 else "Low"
                
                return {
                    "crop_type": crop_type,
                    "disease_label": disease_label,
                    "confidence_score": confidence,
                    "severity": severity,
                    "detected_raw_crop": crop_name,
                    "model_used": "mobilenetv2_crop_gatekeeper"
                }
            except Exception as e:
                print(f"Gatekeeper model failed: {e}")
        
        # Strategy 2: Fallback to agriscan model
        if self.agriscan_interpreter and self.agriscan_class_map:
            try:
                img_array = self._preprocess_image(image_path, self.agriscan_interpreter.get_input_details()[0]['shape'])
                pred_idx, confidence = self._run_inference(self.agriscan_interpreter, img_array)
                crop_name = self.agriscan_class_map[str(pred_idx)]
                
                # Use heuristic green ratio analysis
                r_mean = np.mean(img_array[0, :, :, 0])
                g_mean = np.mean(img_array[0, :, :, 1])
                b_mean = np.mean(img_array[0, :, :, 2])
                
                green_ratio = g_mean / (r_mean + 1e-6)
                is_healthy = green_ratio > 1.05
                
                crop_type = crop_name.capitalize()
                
                if is_healthy:
                    disease_label = f"{crop_type}_Healthy"
                    severity = "Low"
                else:
                    disease_map = {
                        'banana': 'Banana_BBW',
                        'bean': 'Bean_Angular_Leaf_Spot',
                        'cassava': 'Cassava_CMD',
                        'coffee': 'Coffee_Leaf_Rust',
                        'corn': 'Corn_Northern_Leaf_Blight',
                        'groundnuts': 'Groundnut_Rosette',
                        'potato': 'Potato_Late_Blight',
                        'tomato': 'Tomato_Early_Blight'
                    }
                    disease_label = disease_map.get(crop_name, f'{crop_type}_Disease')
                    severity = "High"
                
                return {
                    "crop_type": crop_type,
                    "disease_label": disease_label,
                    "confidence_score": confidence,
                    "severity": severity,
                    "detected_raw_crop": crop_name,
                    "model_used": "agriscan_model (fallback)"
                }
            except Exception as e:
                print(f"Agriscan model failed: {e}")
        
        # Ultimate fallback
        return {
            "crop_type": "Unknown",
            "disease_label": "Unknown_Disease",
            "confidence_score": 0.0,
            "severity": "Unknown",
            "detected_raw_crop": "Unknown",
            "model_used": "none"
        }
    
    def _predict_with_disease_expert(self, image_path: str, crop_type: str):
        """
        Use crop-specific disease expert model if available
        """
        model_path = self.disease_expert_models.get(crop_type)
        if not model_path or not os.path.exists(model_path):
            return None
        
        # Load model if not cached
        if crop_type not in self.disease_model_cache:
            interpreter = self._load_model(model_path)
            if not interpreter:
                return None
            
            # Load crop-specific class map
            class_map_path = None
            if crop_type == "coffee":
                class_map_path = os.path.join(self.model_dir, "coffe_model", "class_map.json")
            elif crop_type == "maize":
                # Try maize_disease_expert first, fallback to maize_model
                maize_expert_map = os.path.join(self.model_dir, "maize_disease_expert.tflite")
                if os.path.exists(maize_expert_map):
                    # maize_disease_expert uses same class map as maize_model
                    class_map_path = os.path.join(self.model_dir, "maize_model", "class_map.json")
                else:
                    class_map_path = os.path.join(self.model_dir, "maize_model", "class_map.json")
            
            if not class_map_path or not os.path.exists(class_map_path):
                return None
            
            class_map = self._load_class_map(class_map_path)
            self.disease_model_cache[crop_type] = {
                'interpreter': interpreter,
                'class_map': class_map
            }
        
        try:
            cached = self.disease_model_cache[crop_type]
            img_array = self._preprocess_image(image_path, cached['interpreter'].get_input_details()[0]['shape'])
            pred_idx, confidence = self._run_inference(cached['interpreter'], img_array)
            disease_label = cached['class_map'][str(pred_idx)]
            
            # Determine severity
            if "Healthy" in disease_label:
                severity = "Low"
            elif confidence > 0.8:
                severity = "High"
            elif confidence > 0.5:
                severity = "Medium"
            else:
                severity = "Low"
            
            return {
                "crop_type": crop_type.capitalize(),
                "disease_label": disease_label,
                "confidence_score": confidence,
                "severity": severity,
                "detected_raw_crop": disease_label,
                "model_used": f"{crop_type}_disease_expert"
            }
        except Exception as e:
            print(f"Disease expert model failed for {crop_type}: {e}")
            return None

# Singleton instance
inference_service = None

def get_inference_service():
    global inference_service
    if inference_service is None:
        inference_service = CropInferenceService()
    return inference_service
