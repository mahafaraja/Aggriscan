# Multi-Model Architecture - Flexible Disease Detection

## Overview

Instead of one large model with all 8 crops, we'll use **multiple specialized models** (6-8 models total), each handling 1-2 related crops. This approach is:
- **More flexible**: Use different datasets for different models
- **Faster to train**: Smaller models, less data per model
- **More accurate**: Specialized models perform better
- **Easier to update**: Add new crops without retraining everything
- **Includes prevention info**: Each model has disease prevention tips

---

## Model Organization

### Strategy: Group Related Crops

Based on disease similarity and dataset availability:

#### Model 1: Cassava Specialist
**Crops**: Cassava only
**Diseases**: 5 classes
- Cassava_Healthy
- Cassava_CMD (Mosaic Disease)
- Cassava_Brown_Streak
- Cassava_Green_Mottle
- Cassava_Bacterial_Blight

**Why separate**: Cassava is most important crop in Uganda, has unique diseases

#### Model 2: Banana Specialist
**Crops**: Banana only
**Diseases**: 4 classes
- Banana_Healthy
- Banana_Black_Sigatoka
- Banana_Pestalotiopsis
- Banana_Cordana

**Why separate**: Banana diseases are very specific, high economic impact

#### Model 3: Tomato Specialist
**Crops**: Tomato only
**Diseases**: 4 classes
- Tomato_Healthy
- Tomato_Early_Blight
- Tomato_Late_Blight
- Tomato_Leaf_Mold

**Why separate**: Tomato has many diseases, widely cultivated

#### Model 4: Potato & Coffee Model
**Crops**: Potato + Coffee
**Diseases**: 6 classes
- Potato_Healthy
- Potato_Late_Blight
- Potato_Brown_Streak
- Coffee_Healthy
- Coffee_Leaf_Rust
- Coffee_Phoma

**Why grouped**: Both are leaf-based diseases, similar appearance

#### Model 5: Corn & Groundnuts Model
**Crops**: Corn + Groundnuts
**Diseases**: 9 classes
- Corn_Healthy
- Corn_Northern_Leaf_Blight
- Corn_Gray_Leaf_Spot
- Corn_Brown_Streak
- Groundnuts_Healthy
- Groundnuts_Early_Rust
- Groundnuts_Late_Rust
- Groundnuts_Early_Spot
- Groundnuts_Late_Spot

**Why grouped**: Similar disease patterns, often grown together

#### Model 6: Bean Specialist
**Crops**: Bean only
**Diseases**: 4 classes
- Bean_Healthy
- Bean_Angular_Leaf_Spot
- Bean_Anthracnose
- Bean_Rust

**Why separate**: Bean diseases are unique, need dedicated model

#### Model 7: Fallback/Catch-all Model
**Crops**: All 8 crops (generalist)
**Diseases**: 8 classes (crop types only)
- banana
- bean
- cassava
- coffee
- corn
- groundnuts
- potato
- tomato

**Purpose**: 
- Used when crop type is unclear
- Quick crop identification
- Fallback when specialized models fail

---

## Dataset Sources Per Model

### Model 1: Cassava
**Source**: Your existing dataset (D:/codes/agriscan_dataset/dataset/cassava/)
**Classes**: 5 (healthy, bactirial_blight, brown_streak_disease, green_mottle, mosaic_disease)
**Images**: ~7,000
**Status**: Ready to train

### Model 2: Banana
**Source**: Your existing dataset (D:/codes/agriscan_dataset/dataset/banana/)
**Classes**: 4 (healthy, singatoka, pestalotiopsis, cordana)
**Images**: ~1,600
**Status**: Ready to train

### Model 3: Tomato
**Source**: Your existing dataset (D:/codes/agriscan_dataset/dataset/tomato/)
**Classes**: 4 (healthy, early_blight, late_blight, leaf_mold)
**Images**: ~4,000
**Status**: Ready to train

### Model 4: Potato & Coffee
**Source**: Your existing dataset
**Potato**: 3 classes, ~2,000 images
**Coffee**: 4 classes, ~6,000 images
**Total**: 7 classes, ~8,000 images
**Status**: Ready to train

### Model 5: Corn & Groundnuts
**Source**: Your existing dataset
**Corn**: 4 classes, ~4,000 images
**Groundnuts**: 6 classes, ~7,900 images
**Total**: 10 classes, ~12,000 images
**Status**: Ready to train

### Model 6: Bean
**Source**: Your existing dataset (D:/codes/agriscan_dataset/dataset/bean/)
**Classes**: 4 (healthy, Angular_Leaf_Spot, Anthracnose, rust_Disease)
**Images**: ~3,500
**Status**: Ready to train

### Model 7: Fallback (Generalist)
**Source**: PlantVillage dataset on Kaggle
**URL**: https://www.kaggle.com/datasets/spandanpatnaik09/plant-village
**Classes**: 8 (crop types only)
**Images**: 54,000+
**Status**: Need to download and train

---

## Disease Prevention Information

Each model includes a prevention_info.json file with disease details:

```json
{
  "cassava": {
    "Cassava_CMD": {
      "name": "Cassava Mosaic Disease",
      "severity": "High",
      "symptoms": [
        "Mottled yellow patches on leaves",
        "Stunted growth",
        "Reduced root size"
      ],
      "prevention": [
        "Use resistant varieties (e.g., NASE 1, NASE 2)",
        "Remove and destroy infected plants",
        "Use clean planting material",
        "Control whitefly vectors with insecticides",
        "Practice crop rotation (3-4 years)"
      ],
      "treatment": [
        "No cure available - focus on prevention",
        "Uproot and burn infected plants",
        "Plant resistant varieties"
      ],
      "economic_impact": "Can cause 20-100% yield loss"
    }
  }
}
```

---

## Model Architecture

### Directory Structure
```
D:/codes/agriscan_dataset/
├── models/
│   ├── cassava/
│   │   ├── cassava_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   ├── banana/
│   │   ├── banana_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   ├── tomato/
│   │   ├── tomato_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   ├── potato_coffee/
│   │   ├── potato_coffee_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   ├── corn_groundnuts/
│   │   ├── corn_groundnuts_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   ├── bean/
│   │   ├── bean_model.tflite
│   │   ├── class_map.json
│   │   └── prevention_info.json
│   └── fallback/
│       ├── fallback_model.tflite
│       ├── class_map.json
│       └── prevention_info.json
├── datasets/
│   ├── cassava/
│   ├── banana/
│   ├── tomato/
│   ├── potato_coffee/
│   ├── corn_groundnuts/
│   ├── bean/
│   └── fallback/
└── reports/
```

---

## Inference Flow

### Step 1: Image Input
User takes photo of crop leaf

### Step 2: Quick Crop Detection (Fallback Model)
```python
# Use lightweight fallback model to identify crop type
crop_type = fallback_model.predict(image)
# Output: "cassava" (8-class model, very fast)
```

### Step 3: Route to Specialized Model
```python
# Based on crop type, use specialized model
if crop_type == "cassava":
    result = cassava_model.predict(image)
    # Output: "Cassava_CMD" with 95% confidence
elif crop_type == "banana":
    result = banana_model.predict(image)
    # Output: "Banana_Black_Sigatoka" with 92% confidence
elif crop_type == "tomato":
    result = tomato_model.predict(image)
    # Output: "Tomato_Early_Blight" with 94% confidence
# ... etc
```

### Step 4: Get Disease Prevention Info
```python
prevention_info = load_prevention_info(crop_type, disease_label)
# Returns: symptoms, prevention steps, treatment options, economic impact
```

### Step 5: Return Complete Result
```json
{
  "crop_type": "Cassava",
  "disease_label": "Cassava_CMD",
  "confidence_score": 0.95,
  "severity": "High",
  "model_used": "cassava_specialist",
  "prevention": {
    "symptoms": [...],
    "prevention": [...],
    "treatment": [...],
    "economic_impact": "..."
  }
}
```

---

## Training Script Updates

### Multi-Model Training Script

Create ml/train_multi_model.py:

```python
"""
Train multiple specialized models for different crop groups
"""
import os
import json
import tensorflow as tf
from tensorflow.keras import layers, models, optimizers, callbacks

# Model configurations
MODEL_CONFIGS = {
    'cassava': {
        'crops': ['cassava'],
        'diseases': {
            'cassava': ['healthy', 'bactirial_blight', 'brown_streak_disease', 
                        'green_mottle', 'mosaic_disease']
        }
    },
    'banana': {
        'crops': ['banana'],
        'diseases': {
            'banana': ['healthy', 'singatoka', 'pestalotiopsis', 'cordana']
        }
    },
    'tomato': {
        'crops': ['tomato'],
        'diseases': {
            'tomato': ['healthy', 'early_blight', 'late_blight', 'leaf_mold']
        }
    },
    'potato_coffee': {
        'crops': ['potato', 'coffee'],
        'diseases': {
            'potato': ['healthy', 'Late_blight', 'brown_streak_disease'],
            'coffee': ['healthy', 'leaf_rust', 'phoma']
        }
    },
    'corn_groundnuts': {
        'crops': ['corn', 'groundnuts'],
        'diseases': {
            'corn': ['healthy', 'Northern_Leaf_Blight', 'Gray_leaf_spot', 'brown_streak_disease'],
            'groundnuts': ['healthy', 'early_rust', 'late_rust', 'early_spot', 'late_spot']
        }
    },
    'bean': {
        'crops': ['bean'],
        'diseases': {
            'bean': ['healthy', 'Angular_Leaf_Spot', 'Anthracnose', 'rust_Disease']
        }
    },
    'fallback': {
        'crops': ['banana', 'bean', 'cassava', 'coffee', 'corn', 'groundnuts', 'potato', 'tomato'],
        'diseases': 'crop_types_only'  # Just identify the crop
    }
}

def train_model(model_name, config, data_dir, output_dir):
    """Train a single specialized model"""
    print(f"\n{'='*60}")
    print(f"Training model: {model_name}")
    print(f"{'='*60}")
    
    # Prepare dataset
    # ... (restructure data for this specific model)
    
    # Build model
    num_classes = len(config['diseases'])
    model, base_model = build_transfer_learning_model(num_classes=num_classes)
    
    # Train
    # ... (training code)
    
    # Convert to TFLite
    # ... (conversion code)
    
    # Save
    model_path = os.path.join(output_dir, model_name, f'{model_name}_model.tflite')
    class_map_path = os.path.join(output_dir, model_name, f'{model_name}_class_map.json')
    
    print(f"Model saved: {model_path}")
    return model_path

def train_all_models(base_data_dir, output_dir):
    """Train all models"""
    for model_name, config in MODEL_CONFIGS.items():
        # Prepare data for this model
        # Train model
        # Save model
        pass

if __name__ == "__main__":
    # Train all models
    train_all_models(
        base_data_dir='D:/codes/agriscan_dataset/dataset',
        output_dir='D:/codes/agriscan_dataset/models'
    )
```

---

## Backend Updates

### Multi-Model Inference Service

Update backend/app/services/inference.py:

```python
class MultiModelInferenceService:
    def __init__(self):
        self.models = {}
        self.prevention_info = {}
        self.load_all_models()
    
    def load_all_models(self):
        """Load all specialized models"""
        model_configs = {
            'cassava': 'models/cassava/cassava_model.tflite',
            'banana': 'models/banana/banana_model.tflite',
            'tomato': 'models/tomato/tomato_model.tflite',
            'potato_coffee': 'models/potato_coffee/potato_coffee_model.tflite',
            'corn_groundnuts': 'models/corn_groundnuts/corn_groundnuts_model.tflite',
            'bean': 'models/bean/bean_model.tflite',
            'fallback': 'models/fallback/fallback_model.tflite'
        }
        
        for model_name, model_path in model_configs.items():
            self.models[model_name] = self.load_model(model_path)
            self.prevention_info[model_name] = self.load_prevention_info(model_name)
    
    def predict(self, image_path):
        """Two-stage prediction: crop detection then disease classification"""
        # Stage 1: Identify crop type
        crop_type = self.fallback_model.predict(image_path)
        
        # Stage 2: Use specialized model
        specialized_model = self.models.get(crop_type, self.models['fallback'])
        result = specialized_model.predict(image_path)
        
        # Stage 3: Add prevention info
        prevention = self.prevention_info.get(crop_type, {})
        
        return {
            'crop_type': result['crop_type'],
            'disease_label': result['disease_label'],
            'confidence_score': result['confidence_score'],
            'severity': result['severity'],
            'prevention': prevention,
            'model_used': crop_type
        }
```

---

## Frontend Updates

### Display Prevention Information

Update ScanResultScreen.tsx:

```typescript
// Show disease prevention tips
{result.prevention && (
  <View>
    <Text style={styles.sectionTitle}>Prevention & Treatment</Text>
    
    <Text style={styles.subtitle}>Symptoms:</Text>
    {result.prevention.symptoms.map((symptom, i) => (
      <Text key={i}>• {symptom}</Text>
    ))}
    
    <Text style={styles.subtitle}>Prevention:</Text>
    {result.prevention.prevention.map((step, i) => (
      <Text key={i}>{i + 1}. {step}</Text>
    ))}
    
    <Text style={styles.subtitle}>Treatment:</Text>
    {result.prevention.treatment.map((treatment, i) => (
      <Text key={i}>{i + 1}. {treatment}</Text>
    ))}
    
    <Text style={styles.impact}>
      Economic Impact: {result.prevention.economic_impact}
    </Text>
  </View>
)}
```

---

## Implementation Plan

### Phase 1: Prepare Datasets (1 day)
1. Create separate dataset folders for each model
2. Restructure data using preprocessing scripts
3. Verify each dataset has correct classes

### Phase 2: Train Models (3-5 days)
1. Train cassava model (30 min)
2. Train banana model (20 min)
3. Train tomato model (25 min)
4. Train potato_coffee model (40 min)
5. Train corn_groundnuts model (1 hour)
6. Train bean model (30 min)
7. Train fallback model (1 hour)

Total training time: ~4 hours (can run in parallel)

### Phase 3: Create Prevention Info (2 days)
1. Research disease prevention for each crop
2. Create prevention_info.json for each model
3. Verify information with agricultural experts

### Phase 4: Update Backend (1 day)
1. Update inference service to support multiple models
2. Implement two-stage prediction (crop → disease)
3. Add prevention info to API responses

### Phase 5: Update Frontend (1 day)
1. Display prevention information
2. Add model selection indicator
3. Test with real images

### Phase 6: Test & Deploy (1 day)
1. Test each model individually
2. Test end-to-end flow
3. Deploy to production

Total time: ~1 week

---

## Benefits of This Approach

### 1. Flexibility
- Easy to add new crops (just train new model)
- Can update models independently
- No need to retrain everything when adding one crop

### 2. Performance
- Smaller models = faster inference
- Specialized models = higher accuracy
- Can optimize each model separately

### 3. Maintenance
- Update one model without affecting others
- Easy to debug (isolated models)
- Can A/B test different architectures

### 4. Disease Prevention
- Each model includes specific prevention tips
- Farmers get actionable information
- Localized advice per crop

### 5. Scalability
- Start with 6-7 models
- Add more as needed
- Can distribute models via app updates

---

## Example Usage

### User Flow:
1. User opens app, takes photo of cassava leaf
2. App sends image to backend
3. Backend uses fallback model → identifies as "cassava"
4. Backend uses cassava specialist model → "Cassava_CMD, 95% confidence"
5. Backend loads prevention info for Cassava_CMD
6. App displays:
   - Disease: Cassava Mosaic Disease
   - Severity: High
   - Symptoms: [list]
   - Prevention: [list]
   - Treatment: [list]
   - Economic Impact: "Can cause 20-100% yield loss"

---

## Next Steps

1. Review this architecture
2. Create dataset restructuring script
3. Update training scripts for multi-model support
4. Create prevention_info.json templates
5. Start training models one by one
6. Update backend inference service
7. Update frontend to show prevention info
8. Test thoroughly
9. Deploy

This approach is much more practical than one large model!