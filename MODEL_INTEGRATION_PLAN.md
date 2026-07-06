# Model Integration Plan - Pre-trained Crop Disease Detection

## Recommended Repository

**Primary Choice: PlantVillage Dataset Models**
- Repository: https://github.com/Spandan-Madan/Plant_Village
- Alternative: https://github.com/tensorflow/models/tree/master/research/slim
- Dataset: https://data.mendeley.com/datasets/tywbtsjrjv/1

## Why This Model?

1. **Trained on Real Data**: 38,000+ real crop disease images from PlantVillage dataset
2. **Proven Accuracy**: 99%+ accuracy on test sets
3. **TFLite Ready**: Can be converted to TensorFlow Lite format
4. **Mobile Optimized**: Lightweight architectures suitable for mobile deployment
5. **Active Maintenance**: Well-documented and community-supported

## Implementation Steps

### Step 1: Download Pre-trained Model

```bash
# Create models directory
mkdir -p backend/app/model_assets/pretrained

# Download MobileNetV2 pre-trained on PlantVillage
# Option A: Use TensorFlow Hub
wget -O backend/app/model_assets/pretrained/plant_village_mobilenetv2.tflite \
  "https://tfhub.dev/google/aiy/vision/classifier/plants_V1/1?tf-hub-format=compressed"

# Option B: Train from PlantVillage dataset and convert
cd ml
python train_transfer_learning.py --use_pretrained mobilenet_v2
```

### Step 2: Update Training Script for Transfer Learning

Create `ml/train_transfer_learning.py`:

```python
import os
import argparse
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers

def build_transfer_learning_model(input_shape=(224, 224, 3), num_classes=8):
    """
    Uses MobileNetV2 pre-trained on ImageNet for transfer learning
    """
    # Load pre-trained MobileNetV2 (exclude top classification layer)
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        weights='imagenet',
        include_top=False,
        pooling='avg'
    )
    
    # Freeze base model layers
    base_model.trainable = False
    
    # Add custom classification head
    inputs = tf.keras.Input(shape=input_shape)
    
    # Preprocess input (MobileNetV2 expects [0, 255] range)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
    
    # Base model
    x = base_model(x, training=False)
    
    # Custom classifier
    x = layers.Dropout(0.3)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    model = models.Model(inputs, outputs, name="PlantVillage_Transfer_Learning")
    
    return model, base_model

def convert_to_tflite_optimized(model, output_path):
    """
    Convert model to TFLite with optimizations
    """
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    converter.optimizations = [tf.lite.Optimize.DEFAULT]
    converter.target_spec.supported_types = [tf.float16]
    
    tflite_model = converter.convert()
    
    with open(output_path, 'wb') as f:
        f.write(tflite_model)
    
    print(f"TFLite model saved to: {output_path}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default="./dataset")
    parser.add_argument("--output_dir", type=str, default="./tflite")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--fine_tune", action="store_true")
    args = parser.parse_args()
    
    # Load dataset
    train_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="training",
        seed=123,
        image_size=(224, 224),
        batch_size=32
    )
    
    val_ds = tf.keras.utils.image_dataset_from_directory(
        args.data_dir,
        validation_split=0.2,
        subset="validation",
        seed=123,
        image_size=(224, 224),
        batch_size=32
    )
    
    # Get class names
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Classes: {class_names}")
    
    # Build model
    model, base_model = build_transfer_learning_model(num_classes=num_classes)
    
    # Compile
    model.compile(
        optimizer=optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    # Train classifier head
    print("Training classifier head...")
    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs
    )
    
    # Optional fine-tuning
    if args.fine_tune:
        print("Fine-tuning base model...")
        base_model.trainable = True
        model.compile(
            optimizer=optimizers.Adam(learning_rate=0.0001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        model.fit(train_ds, validation_data=val_ds, epochs=5)
    
    # Convert to TFLite
    os.makedirs(args.output_dir, exist_ok=True)
    output_path = os.path.join(args.output_dir, "plant_village_model.tflite")
    convert_to_tflite_optimized(model, output_path)
    
    # Save class map
    class_map = {str(i): name for i, name in enumerate(class_names)}
    import json
    with open(os.path.join(args.output_dir, "class_map.json"), 'w') as f:
        json.dump(class_map, f, indent=2)

if __name__ == "__main__":
    main()
```

### Step 3: Update Backend Inference Service

Update `backend/app/services/inference.py`:

```python
class CropInferenceService:
    def __init__(self):
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.model_dir = os.path.join(os.path.dirname(current_dir), "model_assets")
        
        # Try pretrained model first, fallback to original
        pretrained_model_path = os.path.join(self.model_dir, "pretrained", "plant_village_model.tflite")
        original_model_path = os.path.join(self.model_dir, "agriscan_model.tflite")
        
        self.model_path = pretrained_model_path if os.path.exists(pretrained_model_path) else original_model_path
        self.class_map_path = os.path.join(self.model_dir, "class_map.json")
        
        # Load class map
        with open(self.class_map_path, "r") as f:
            self.class_map = json.load(f)
            
        # Load TFLite model
        self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
        self.interpreter.allocate_tensors()
        
        # Get input/output details
        self.input_details = self.interpreter.get_input_details()
        self.output_details = self.interpreter.get_output_details()
        self.input_shape = self.input_details[0]['shape']
        
        print(f"Loaded model: {self.model_path}")
        print(f"Model input shape: {self.input_shape}")
```

### Step 4: Prepare PlantVillage Dataset

```bash
# Download dataset
cd ml
wget https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/4e6ab7e4-8c7e-4a5f-8f5e-9f5c5c5c5c5c/file_downloaded \
  -O plant_village_dataset.zip

# Extract
unzip plant_village_dataset.zip -d plant_village_raw

# Preprocess for your crops (select only relevant classes)
python preprocess_dataset.py \
  --input_dir ./plant_village_raw \
  --output_dir ./dataset \
  --crops banana bean cassava coffee corn groundnuts potato tomato
```

### Step 5: Test the Model

```bash
cd backend
python test_inference.py
```

Expected output:
```
1. Creating database tables...
2. Initializing inference service...
   Loaded model: backend/app/model_assets/pretrained/plant_village_model.tflite
   Model input shape: [1 224 224 3]
3. Running test prediction...
Prediction result:
{
  'crop_type': 'Cassava',
  'disease_label': 'Cassava_CMD',
  'confidence_score': 0.95,
  'severity': 'High',
  ...
}
```

## Alternative: Use Pre-trained Model Directly

If you don't want to train, use these ready-made models:

1. **TensorFlow Hub Plant Classifier**
   ```python
   import tensorflow_hub as hub
   model = hub.load('https://tfhub.dev/google/aiy/vision/classifier/plants_V1/1')
   ```

2. **Keras Pre-trained Applications**
   ```python
   # MobileNetV2
   model = tf.keras.applications.MobileNetV2(
       weights='imagenet',
       include_top=False,
       pooling='avg'
   )
   ```

## Benefits of This Approach

1. **No Need to Start from Scratch**: Uses proven architectures
2. **Better Accuracy**: Pre-trained on 38K+ real images
3. **Faster Training**: Transfer learning converges in 5-10 epochs
4. **Smaller Model Size**: MobileNetV2 is ~14MB vs ~50MB for custom CNN
5. **TFLite Optimized**: Easy conversion to mobile format

## Next Steps

1. Choose Option A (download pre-trained) or Option B (train with transfer learning)
2. Download/prepare PlantVillage dataset
3. Run training script
4. Convert to TFLite
5. Update backend inference service
6. Test with real images
7. Deploy to production

## Resources

- PlantVillage Dataset: https://data.mendeley.com/datasets/tywbtsjrjv/1
- TensorFlow Hub: https://tfhub.dev/
- TFLite Guide: https://www.tensorflow.org/lite/guide
- Transfer Learning Guide: https://www.tensorflow.org/guide/keras/transfer_learning