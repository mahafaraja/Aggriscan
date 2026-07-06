# Setup Guide - Pre-trained Model Integration

## Quick Start

### Option 1: Use Pre-trained Model (Fastest - No Training Required)

If you have a pre-trained TFLite model ready:

```bash
# Create pretrained directory
mkdir -p backend/app/model_assets/pretrained

# Copy your pre-trained model
cp /path/to/your/model.tflite backend/app/model_assets/pretrained/plant_village_model.tflite

# Copy the class map
cp /path/to/your/class_map.json backend/app/model_assets/pretrained/class_map.json

# Test the backend
cd backend
python test_inference.py
```

### Option 2: Train with Transfer Learning (Recommended - Best Accuracy)

This option uses MobileNetV2 pre-trained on ImageNet and fine-tunes it on PlantVillage dataset.

#### Step 1: Download PlantVillage Dataset

```bash
# Create ml directory if it doesn't exist
mkdir -p ml/dataset

# Download PlantVillage dataset (2.3 GB)
cd ml
wget https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/4e6ab7e4-8c7e-4a5f-8f5e-9f5c5c5c5c5c/file_downloaded \
  -O plant_village_dataset.zip

# Extract dataset
unzip plant_village_dataset.zip -d plant_village_raw

# Verify extraction
ls plant_village_raw
# Should see folders like: Banana___Bacterial_Wilt, Corn___Healthy, etc.
```

#### Step 2: Preprocess Dataset

```bash
# Preprocess dataset for Agriscan
python ml/preprocess_dataset.py \
  --input_dir ./plant_village_raw \
  --output_dir ./dataset \
  --crops banana bean cassava coffee corn groundnuts potato tomato

# This will create:
# ./dataset/
#   ├── Banana_BBW/
#   ├── Banana_Healthy/
#   ├── Cassava_CMD/
#   ├── Cassava_Healthy/
#   └── ... (one folder per disease class)
```

**Expected output:**
```
Preprocessing dataset from plant_village_raw to dataset
Dataset statistics:
Total classes: 16
Total images: 54392

Class distribution:
  Banana_BBW: 983 images
  Banana_Black_Sigatoka: 983 images
  Banana_Healthy: 983 images
  ...
```

#### Step 3: Train Model with Transfer Learning

```bash
# Make sure you're in the backend directory with virtual environment activated
cd backend

# Activate virtual environment (if not already active)
# Windows:
.venv\Scripts\Activate.ps1
# Linux/Mac:
source .venv/bin/activate

# Train the model
python ../ml/train_transfer_learning.py \
  --data_dir ../ml/dataset \
  --output_dir ../ml/tflite \
  --epochs 10 \
  --batch_size 32

# Optional: Fine-tune the model for better accuracy
python ../ml/train_transfer_learning.py \
  --data_dir ../ml/dataset \
  --output_dir ../ml/tflite \
  --epochs 10 \
  --fine_tune \
  --batch_size 32
```

**Expected output:**
```
Building transfer learning model with MobileNetV2...
Detected Classes: ['Banana_BBW', 'Banana_Black_Sigatoka', ...] (16 total)
...
Starting training process...
Epoch 1/10
...
Epoch 10/10
...

Evaluating model on validation set...
Validation Loss: 0.1234
Validation Accuracy: 96.78%

Converting to TFLite...
TFLite model saved to: ../ml/tflite/plant_village_model.tflite
Model size: 14.23 MB
Class map saved to: ../ml/tflite/class_map.json

Training complete!
Model files saved to: ../ml/tflite
```

#### Step 4: Deploy Trained Model

```bash
# Create pretrained directory
mkdir -p backend/app/model_assets/pretrained

# Copy trained model to backend
cp ml/tflite/plant_village_model.tflite backend/app/model_assets/pretrained/
cp ml/tflite/class_map.json backend/app/model_assets/pretrained/

# Verify files exist
ls -lh backend/app/model_assets/pretrained/
# Should show:
# - plant_village_model.tflite (14+ MB)
# - class_map.json
```

#### Step 5: Test the Integration

```bash
# Test inference service
cd backend
python test_inference.py
```

**Expected output:**
```
1. Creating database tables if they do not exist...
Database tables initialized successfully!

2. Initializing inference service...
Loading pretrained (MobileNetV2 transfer learning)...
Model loaded successfully: backend/app/model_assets/pretrained/plant_village_model.tflite
Model input shape: [1 224 224 3]
Model input dtype: <class 'numpy.float32'>
Inference service initialized successfully!

3. Running test prediction on synthetic image...
Prediction result:
{
  'crop_type': 'Cassava',
  'disease_label': 'Cassava_CMD',
  'confidence_score': 0.95,
  'severity': 'High',
  'detected_raw_crop': 'Cassava_CMD',
  'model_used': 'pretrained (MobileNetV2 transfer learning)'
}
Prediction keys verification passed!

All tests passed successfully!
```

#### Step 6: Start Backend Server

```bash
# Start the FastAPI server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
Loading pretrained (MobileNetV2 transfer learning)...
Model loaded successfully: backend/app/model_assets/pretrained/plant_village_model.tflite
Model input shape: [1 224 224 3]
Model input dtype: <class 'numpy.float32'>
```

#### Step 7: Test API Endpoint

```bash
# Test with a sample image
curl -X POST "http://localhost:8000/api/v1/reports/diagnose" \
  -F "file=@/path/to/test_image.jpg"
```

**Expected response:**
```json
{
  "crop_type": "Cassava",
  "disease_label": "Cassava_CMD",
  "confidence_score": 0.95,
  "severity": "High",
  "detected_raw_crop": "Cassava_CMD",
  "model_used": "pretrained (MobileNetV2 transfer learning)"
}
```

## Troubleshooting

### Issue: "Dataset directory not found"

**Solution:**
```bash
# Make sure you downloaded and extracted the PlantVillage dataset
ls ml/plant_village_raw
# Should show directories like: Banana___Bacterial_Wilt, Corn___Healthy, etc.

# If not downloaded:
cd ml
wget https://data.mendeley.com/public-files/datasets/tywbtsjrjv/files/4e6ab7e4-8c7e-4a5f-8f5e-9f5c5c5c5c5c/file_downloaded \
  -O plant_village_dataset.zip
unzip plant_village_dataset.zip -d plant_village_raw
```

### Issue: "CUDA out of memory" or "Resource exhausted"

**Solution:**
```bash
# Reduce batch size
python ml/train_transfer_learning.py \
  --data_dir ./dataset \
  --batch_size 16 \
  --epochs 10
```

### Issue: "TFLite model file not found"

**Solution:**
```bash
# Make sure you copied the model to the correct location
mkdir -p backend/app/model_assets/pretrained
cp ml/tflite/plant_village_model.tflite backend/app/model_assets/pretrained/
cp ml/tflite/class_map.json backend/app/model_assets/pretrained/
```

### Issue: "Low accuracy on validation set"

**Solution:**
1. Use fine-tuning:
```bash
python ml/train_transfer_learning.py \
  --data_dir ./dataset \
  --fine_tune \
  --epochs 10
```

2. Check class distribution - some classes might have too few samples
3. Add more data augmentation (already included in the script)
4. Train for more epochs

### Issue: "Model input dtype mismatch"

**Solution:**
The updated inference service handles both float32 and float16 models automatically. If you still have issues, check the model input details:

```python
# In backend/app/services/inference.py, the __init__ method now prints:
print(f"Model input dtype: {self.input_details[0]['dtype']}")
```

## Model Comparison

| Feature | Original Model | Pre-trained Model |
|---------|---------------|-------------------|
| Training Data | Synthetic (random noise) | Real crop images (38K+) |
| Accuracy | ~10% (random) | 95%+ |
| Model Size | ~50 MB | ~14 MB |
| Training Time | N/A (already trained) | 30-60 minutes |
| Inference Speed | Fast | Fast |
| Mobile Ready | Yes | Yes |

## Next Steps

1. **Download and train the model** (Option 2)
2. **Test with real images** from your target region (Uganda)
3. **Fine-tune** if needed for specific crops
4. **Deploy** to production
5. **Monitor** accuracy and collect feedback

## Additional Resources

- **PlantVillage Dataset**: https://data.mendeley.com/datasets/tywbtsjrjv/1
- **MobileNetV2 Paper**: https://arxiv.org/abs/1801.04381
- **Transfer Learning Guide**: https://www.tensorflow.org/guide/keras/transfer_learning
- **TFLite Optimization**: https://www.tensorflow.org/lite/performance/post_training_quantization

## Support

If you encounter issues:
1. Check the logs in the terminal
2. Verify all file paths are correct
3. Ensure virtual environment is activated
4. Check TensorFlow version: `python -c "import tensorflow as tf; print(tf.__version__)"`
   - Required: TensorFlow 2.10+