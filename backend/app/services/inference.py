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
        
        # Try pretrained model first, fallback to original model
        pretrained_model_path = os.path.join(self.model_dir, "pretrained", "plant_village_model.tflite")
        original_model_path = os.path.join(self.model_dir, "agriscan_model.tflite")
        
        # Use pretrained model if it exists, otherwise use original
        if os.path.exists(pretrained_model_path):
            self.model_path = pretrained_model_path
            self.model_type = "pretrained (MobileNetV2 transfer learning)"
        else:
            self.model_path = original_model_path
            self.model_type = "original (custom CNN)"
        
        self.class_map_path = os.path.join(self.model_dir, "class_map.json")
        
        # Load class map
        if not os.path.exists(self.class_map_path):
            raise FileNotFoundError(f"Class map file not found at: {self.class_map_path}")
            
        with open(self.class_map_path, "r") as f:
            self.class_map = json.load(f)
            
        # Load TFLite model and allocate tensors
        if not os.path.exists(self.model_path):
            raise FileNotFoundError(f"TFLite model file not found at: {self.model_path}")
            
        print(f"Loading {self.model_type}...")
        self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
        self.interpreter.allocate_tensors()
        
        # Get input and output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.input_shape = self.input_details[0]['shape'] # expected [1, 224, 224, 3]
        
        print(f"Model loaded successfully: {self.model_path}")
        print(f"Model input shape: {self.input_shape}")
        print(f"Model input dtype: {self.input_details[0]['dtype']}")

    def predict_crop(self, image_path: str):
        """
        Loads an image, preprocesses it, runs inference, and returns predicted crop type,
        confidence score, mapped disease labels, and severity.
        """
        # Load image
        img = Image.open(image_path).convert('RGB')
        # Resize to expected shape
        img = img.resize((self.input_shape[1], self.input_shape[2]))
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.float32)
        # Add batch dimension: shape (1, 224, 224, 3)
        img_array = np.expand_dims(img_array, axis=0)
        
        # Preprocess based on model type
        if self.model_type.startswith("pretrained"):
            # MobileNetV2 preprocessing: scale to [0, 255] and then preprocess
            img_array = img_array  # Already in [0, 255] from uint8
            # Note: The TFLite model with Float16 quantization expects float32 input
            # Preprocessing was done during training, so we just normalize to [0, 1]
            img_array = img_array / 255.0
        else:
            # Original model preprocessing: scale to [0, 1]
            img_array = img_array / 255.0
        
        # Set tensor input
        self.interpreter.set_tensor(self.input_details[0]['index'], img_array)
        # Invoke interpreter
        self.interpreter.invoke()
        
        # Retrieve output probabilities
        output_data = self.interpreter.get_tensor(self.output_details[0]['index'])[0]
        
        # Get predicted index
        pred_idx = int(np.argmax(output_data))
        confidence = float(output_data[pred_idx])
        
        # Retrieve crop name from class map
        crop_name = self.class_map[str(pred_idx)]
        
        # For pretrained model, the class map already contains full labels like "Cassava_CMD"
        # For original model, we need to determine health status
        if self.model_type.startswith("pretrained"):
            # Class map contains full disease labels
            if "_Healthy" in crop_name:
                crop_type = crop_name.split("_")[0]
                disease_label = crop_name
                severity = "Low"
            else:
                # Extract crop type from label (e.g., "Cassava_CMD" -> "Cassava")
                crop_type = crop_name.split("_")[0]
                disease_label = crop_name
                
                # Determine severity based on confidence
                if confidence > 0.8:
                    severity = "High"
                elif confidence > 0.5:
                    severity = "Medium"
                else:
                    severity = "Low"
        else:
            # Original model: use heuristic green ratio analysis
            r_mean = np.mean(img_array[0, :, :, 0])
            g_mean = np.mean(img_array[0, :, :, 1])
            b_mean = np.mean(img_array[0, :, :, 2])
            
            # Greenness index
            green_ratio = g_mean / (r_mean + 1e-6)
            is_healthy = green_ratio > 1.05
            
            # Map to disease labels and severity
            crop_type = crop_name.capitalize()
            
            if is_healthy:
                disease_label = f"{crop_type}_Healthy"
                severity = "Low"
            else:
                # Map common diseases for each crop type
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
            "model_used": self.model_type
        }

# Singleton instance
inference_service = None

def get_inference_service():
    global inference_service
    if inference_service is None:
        inference_service = CropInferenceService()
    return inference_service
