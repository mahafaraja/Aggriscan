# TFLite Model Assets Analysis

## Overview
This document provides a comprehensive analysis of all TFLite models in the Agriscan system, their accuracy, optimization crops, and recommended usage in the fallback chain.

## Model Inventory

### 1. Root Level Models (Primary Fallback System)

#### agriscan_model.tflite (3.7 MB)
- **Type**: Original custom CNN
- **Purpose**: General crop type identification
- **Classes**: 8 crops (banana, bean, cassava, coffee, corn, groundnuts, potato, tomato)
- **Accuracy**: ~65% (based on test results)
- **Status**: ✅ Active (fallback in inference.py)
- **Use Case**: Basic crop identification when Gemini API fails

#### mobilenetv2_crop_gatekeeper.tflite (2.5 MB)
- **Type**: MobileNetV2 transfer learning
- **Purpose**: Crop type classification (gatekeeper)
- **Classes**: 8 crops
- **Status**: ⚠️ Available but not actively used
- **Use Case**: Could replace agriscan_model.tflite for better accuracy

### 2. Disease Expert Models (Specialized Fallback)

#### banana_disease_expert.tflite (2.5 MB)
- **Crop**: Banana
- **Diseases**: Multiple banana diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized banana disease detection

#### bean_disease_expert.tflite (2.5 MB)
- **Crop**: Bean
- **Diseases**: Multiple bean diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized bean disease detection

#### cassava_disease_expert.tflite (2.5 MB)
- **Crop**: Cassava
- **Diseases**: Multiple cassava diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized cassava disease detection

#### groundnuts_disease_expert.tflite (2.5 MB)
- **Crop**: Groundnuts
- **Diseases**: Multiple groundnut diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized groundnut disease detection

#### potato_disease_expert.tflite (2.5 MB)
- **Crop**: Potato
- **Diseases**: Multiple potato diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized potato disease detection

#### tomato_disease_expert.tflite (2.5 MB)
- **Crop**: Tomato
- **Diseases**: Multiple tomato diseases
- **Status**: ✅ Available for fallback
- **Use Case**: Specialized tomato disease detection

### 3. Subdirectory Models (High Accuracy Specialists)

#### coffe_model/ (4.8 MB)
- **Model**: coffee_model.tflite
- **Type**: MobileNetV2 transfer learning
- **Classes**: 5 (Coffee___Cerscospora, Coffee___Healthy, Coffee___Leaf_Rust, Coffee___Miner, Coffee___Phoma)
- **Accuracy**: 99.7% ⭐ **EXCELLENT**
- **Performance**:
  - Precision: 99.6%
  - Recall: 99.7%
  - F1-Score: 99.6%
  - Support: 5,858 test samples
- **Status**: ✅ Highly accurate
- **Use Case**: Primary model for coffee disease detection

#### maize_model/ (4.8 MB)
- **Model**: maize_model.tflite
- **Type**: MobileNetV2 transfer learning
- **Classes**: 4 (Maize___Blight, Maize___Gray_Leaf_Spot, Maize___Healthy, Maize___common_rust)
- **Accuracy**: 60.7% ⚠️ **POOR**
- **Performance**:
  - Precision: 34.3% (macro avg)
  - Recall: 23.5% (macro avg)
  - F1-Score: 22.7% (macro avg)
  - Support: 168 test samples
- **Issues**:
  - Gray_Leaf_Spot: 0% precision/recall
  - common_rust: 0% precision/recall
  - Blight: 12.9% F1-score
- **Status**: ⚠️ Needs retraining with more data
- **Use Case**: Not recommended for production (insufficient training data)

## Recommended Fallback Chain

### Current Implementation (inference.py)
```
1. Gemini API (Primary) - Cloud-based, high accuracy
   ↓ (fails due to rate limit/error)
2. PlantID API (Fallback 1) - Cloud-based
   ↓ (fails)
3. PlantNet API (Fallback 2) - Cloud-based
   ↓ (fails)
4. Local TFLite Model (Fallback 3) - Offline
   └─ agriscan_model.tflite (65% accuracy)
```

### Proposed Enhanced Fallback Chain
```
1. Gemini API (Primary) - Cloud-based, high accuracy
   ↓ (fails due to rate limit/error)
2. PlantID API (Fallback 1) - Cloud-based
   ↓ (fails)
3. PlantNet API (Fallback 2) - Cloud-based
   ↓ (fails)
4. Crop-Specific Expert Models (Fallback 3) - Offline, high accuracy
   ├─ coffee_model.tflite (99.7% accuracy) for coffee
   ├─ [crop]_disease_expert.tflite for other crops
   └─ mobilenetv2_crop_gatekeeper.tflite for crop type detection
   ↓ (if crop type unknown or model unavailable)
5. General Model (Fallback 4) - Offline
   └─ agriscan_model.tflite (65% accuracy)
```

## Model Optimization Recommendations

### High Priority
1. **Retrain maize_model** with more balanced dataset
   - Current: 168 samples (very small)
   - Target: 1000+ samples per class
   - Expected improvement: 80%+ accuracy

2. **Integrate coffee_model** into fallback chain
   - Replace agriscan_model.tflite for coffee detection
   - Expected improvement: 99.7% vs 65% accuracy

3. **Create cassava_model** with classification report
   - Currently missing classification_report.json
   - Need to train and evaluate

### Medium Priority
4. **Evaluate disease expert models**
   - banana_disease_expert.tflite
   - bean_disease_expert.tflite
   - cassava_disease_expert.tflite
   - groundnuts_disease_expert.tflite
   - potato_disease_expert.tflite
   - tomato_disease_expert.tflite
   - Generate classification reports for each

5. **Replace agriscan_model.tflite** with mobilenetv2_crop_gatekeeper.tflite
   - MobileNetV2 is more modern and accurate
   - Smaller file size (2.5MB vs 3.7MB)

### Low Priority
6. **Quantize models** for faster inference
   - Current: Float32
   - Target: Int8 quantization
   - Expected: 4x faster inference, 75% smaller size

7. **Add model ensemble**
   - Combine multiple models for better accuracy
   - Use voting mechanism

## Implementation Plan

### Phase 1: Immediate (Current Commit)
- ✅ Commit all model assets
- ✅ Document model analysis
- ✅ Keep current fallback chain

### Phase 2: Next Sprint
- [ ] Integrate coffee_model.tflite for coffee detection
- [ ] Replace agriscan_model.tflite with mobilenetv2_crop_gatekeeper.tflite
- [ ] Add crop-specific model selection logic

### Phase 3: Future Enhancement
- [ ] Retrain maize_model with more data
- [ ] Generate classification reports for all disease expert models
- [ ] Implement model ensemble for critical crops
- [ ] Add model performance monitoring

## Model File Sizes
- Total size: ~35 MB
- Largest: coffee_model.tflite (4.8 MB)
- Smallest: class_map.json (164 bytes)
- Average disease expert: 2.5 MB

## Training Data Sources
- Coffee: 5,858 samples (excellent)
- Maize: 168 samples (insufficient)
- Other crops: Unknown (need to check)

## Conclusion
The model assets are well-structured and include high-quality specialized models (especially coffee at 99.7% accuracy). The current fallback system works but can be significantly improved by:
1. Using crop-specific expert models instead of the general model
2. Replacing the poor-performing maize_model
3. Leveraging the excellent coffee_model for coffee detection

The 65% accuracy of agriscan_model.tflite is acceptable as a last resort, but the specialized models should be prioritized for better user experience.