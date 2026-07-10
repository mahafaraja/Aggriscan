# Training for Better Accuracies - Key Findings & Recommendations

## Executive Summary

Your dataset is **excellent** (35K+ images, well-cleaned, good balance), but you need to:
1. **Train 9 specialized models** instead of 1 general model
2. **Use two-stage inference**: Crop detection → Disease classification
3. **Apply proper training techniques**: Transfer learning, augmentation, fine-tuning
4. **Target 95%+ accuracy** on disease classification (not 99% on crop types)

---

## Current Problem Analysis

### What You Have
- ✅ **Excellent dataset**: 35,200+ images across 8 crops
- ✅ **33 disease classes**: Multiple diseases per crop
- ✅ **Good quality**: Cleaned, deduplicated, balanced
- ✅ **99% accuracy**: But on the WRONG problem (crop types, not diseases)

### What's Wrong
- ❌ **Trained 8-class model**: Only classifies crop types (banana, bean, etc.)
- ❌ **Lost disease information**: Collapsed 33 disease classes into 8 crop classes
- ❌ **Wrong architecture**: One large model trying to do everything

### What You Need
- ✅ **9 specialized models**: 1 crop classifier + 8 disease detectors
- ✅ **Two-stage inference**: Identify crop → Detect disease
- ✅ **95%+ accuracy**: On actual disease classification
- ✅ **Treatment integration**: Each model includes prevention info

---

## Recommended Training Strategy

### Architecture: 9-Model System

```
┌─────────────────────────────────────────┐
│   Stage 1: Crop Classifier              │
│   Model: crop_classifier                 │
│   Classes: 8 (banana, bean, cassava...)  │
│   Purpose: Identify which plant type     │
│   Accuracy Target: 98%+                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│   Stage 2: Disease Detection (per crop) │
│                                         │
│  ┌──────────┬──────────┬──────────┐    │
│  │ cassava  │ banana   │ tomato   │    │
│  │ 5 classes│ 4 classes│ 4 classes│    │
│  │ 95%+ acc │ 95%+ acc │ 95%+ acc │    │
│  └──────────┴──────────┴──────────┘    │
│  ┌──────────┬──────────┬──────────┐    │
│  │potato_   │ corn_    │ bean     │    │
│  │coffee    │groundnuts│          │    │
│  │6 classes │ 9 classes│ 4 classes│    │
│  │ 95%+ acc │ 95%+ acc │ 95%+ acc │    │
│  └──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────┘
```

---

## Training Techniques for Better Accuracy

### 1. Transfer Learning (MOST IMPORTANT)

**Why it works**: Pre-trained models already know how to detect edges, textures, patterns

**Recommended architectures** (in order of performance):

```python
# Option 1: MobileNetV2 (Best for mobile - RECOMMENDED)
base_model = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    weights='imagenet',
    include_top=False,
    pooling='avg'
)
# Model size: ~14MB
# Speed: Fast
# Accuracy: 95-97%

# Option 2: EfficientNetB0 (Better accuracy, slightly larger)
base_model = tf.keras.applications.EfficientNetB0(
    input_shape=(224, 224, 3),
    weights='imagenet',
    include_top=False,
    pooling='avg'
)
# Model size: ~29MB
# Speed: Medium
# Accuracy: 96-98%

# Option 3: ResNet50 (Highest accuracy, largest)
base_model = tf.keras.applications.ResNet50(
    input_shape=(224, 224, 3),
    weights='imagenet',
    include_top=False,
    pooling='avg'
)
# Model size: ~98MB
# Speed: Slower
# Accuracy: 97-99%
```

**Training approach**:
```python
# Phase 1: Freeze base model, train only top layers
base_model.trainable = False
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(train_data, epochs=10, validation_data=val_data)

# Phase 2: Unfreeze top layers, fine-tune
base_model.trainable = True
# Freeze first 100 layers, train last 20
for layer in base_model.layers[:100]:
    layer.trainable = False

model.compile(optimizer=tf.keras.optimizers.Adam(1e-5),  # Lower learning rate
              loss='categorical_crossentropy',
              metrics=['accuracy'])
model.fit(train_data, epochs=10, validation_data=val_data)
```

**Expected improvement**: +10-15% accuracy vs training from scratch

---

### 2. Data Augmentation (CRITICAL)

**Why it works**: Increases dataset size 3-5x, prevents overfitting

**Essential augmentations**:
```python
data_augmentation = tf.keras.Sequential([
    # Geometric transformations
    layers.RandomFlip("horizontal_and_vertical"),
    layers.RandomRotation(0.2),  # ±20% rotation
    layers.RandomZoom(0.2),  # ±20% zoom
    layers.RandomTranslation(0.1, 0.1),  # ±10% shift
    
    # Color transformations (IMPORTANT for plant diseases)
    layers.RandomBrightness(0.2),  # Lighting variations
    layers.RandomContrast(0.2),  # Contrast variations
    
    # Optional: Advanced augmentations
    # layers.GaussianNoise(0.01),  # Sensor noise
    # layers.RandomSaturation(0.3),  # Color variations
])
```

**Usage**:
```python
# Apply augmentation during training
train_dataset = train_dataset.map(
    lambda x, y: (data_augmentation(x, training=True), y)
)
```

**Expected improvement**: +5-10% accuracy, especially on real-world images

---

### 3. Class Balancing

**Problem**: Some classes have more images than others
```
Example:
- Cassava_Healthy: 2,500 images
- Cassava_CMD: 800 images  ← Less data
```

**Solutions**:

#### Option A: Class Weights
```python
from sklearn.utils.class_weight import compute_class_weight

# Calculate weights (inverse of class frequency)
class_weights = compute_class_weight(
    'balanced',
    classes=np.unique(y_train),
    y=y_train
)

# Use during training
model.fit(
    train_data,
    epochs=20,
    class_weight=dict(enumerate(class_weights))
)
```

#### Option B: Oversampling
```python
# Duplicate images from minority classes
# Or use SMOTE for synthetic samples
```

**Expected improvement**: +3-7% accuracy on minority classes

---

### 4. Learning Rate Scheduling

**Why it matters**: Too high = unstable, too low = slow convergence

**Recommended schedule**:
```python
# Option 1: ReduceLROnPlateau (adaptive)
lr_scheduler = callbacks.ReduceLROnPlateau(
    monitor='val_accuracy',
    factor=0.5,  # Reduce LR by half
    patience=3,  # After 3 epochs without improvement
    min_lr=1e-7
)

# Option 2: Cosine Decay (smooth)
lr_scheduler = callbacks.LearningRateScheduler(
    lambda epoch: 1e-3 * tf.math.cos(7 * np.pi * epoch / 40) ** 2
)

# Option 3: Step Decay
lr_scheduler = callbacks.StepDecay(
    initial_lr=1e-3,
    drop_factor=0.5,
    epochs_drop=10
)
```

**Usage**:
```python
callbacks = [
    lr_scheduler,
    callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    callbacks.ModelCheckpoint('best_model.h5', save_best_only=True)
]

model.fit(train_data, epochs=50, callbacks=callbacks)
```

**Expected improvement**: +2-5% accuracy, faster convergence

---

### 5. Image Preprocessing

**Critical for plant disease detection**:

```python
def preprocess_image(image_path):
    # 1. Resize to standard size
    image = tf.keras.preprocessing.image.load_img(
        image_path,
        target_size=(224, 224)
    )
    
    # 2. Convert to array
    image = tf.keras.preprocessing.image.img_to_array(image)
    
    # 3. Normalize (IMPORTANT!)
    # Option A: Normalize to [0, 1]
    image = image / 255.0
    
    # Option B: Normalize with ImageNet stats (for pre-trained models)
    image = tf.keras.applications.mobilenet_v2.preprocess_input(image)
    
    return image
```

**Additional preprocessing**:
```python
# 1. Background removal (optional but helpful)
# Remove soil, shadows, non-leaf areas

# 2. Color space conversion
# Convert RGB to HSV or LAB for better disease detection

# 3. Contrast enhancement
# CLAHE (Contrast Limited Adaptive Histogram Equalization)
```

**Expected improvement**: +2-4% accuracy

---

### 6. Model Architecture Best Practices

**Recommended architecture**:
```python
def build_model(num_classes, input_shape=(224, 224, 3)):
    # Input layer
    inputs = tf.keras.Input(shape=input_shape)
    
    # Data augmentation (only during training)
    x = data_augmentation(inputs)
    
    # Pre-trained base model
    base_model = tf.keras.applications.MobileNetV2(
        input_shape=input_shape,
        weights='imagenet',
        include_top=False,
        pooling='avg'
    )
    x = base_model(x, training=False)  # Inference mode for batch norm
    
    # Custom top layers
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.3)(x)  # Prevent overfitting
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    
    # Output layer
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    
    # Create model
    model = tf.keras.Model(inputs, outputs)
    
    return model
```

**Key points**:
- ✅ Use pre-trained base (transfer learning)
- ✅ Add dropout (0.2-0.3) to prevent overfitting
- ✅ Use batch normalization
- ✅ Keep top layers simple (avoid overfitting)
- ✅ Use softmax for multi-class classification

---

### 7. Training Configuration

**Optimal settings**:
```python
# Optimizer
optimizer = tf.keras.optimizers.Adam(
    learning_rate=1e-3,  # Start high
    beta_1=0.9,
    beta_2=0.999,
    weight_decay=1e-4  # L2 regularization
)

# Loss function
loss = 'categorical_crossentropy'  # For one-hot encoded labels
# OR
loss = 'sparse_categorical_crossentropy'  # For integer labels

# Metrics
metrics = ['accuracy', tf.keras.metrics.TopKCategoricalAccuracy(k=3)]  # Top-3 accuracy

# Batch size
batch_size = 32  # Adjust based on GPU memory

# Epochs
epochs = 50  # With early stopping

# Callbacks
callbacks = [
    callbacks.EarlyStopping(patience=5, restore_best_weights=True),
    callbacks.ReduceLROnPlateau(patience=3, factor=0.5),
    callbacks.ModelCheckpoint('best_model.h5', save_best_only=True)
]
```

---

## Training Pipeline for Each Model

### Example: Cassava Model (5 classes)

```python
# Step 1: Prepare dataset
train_data, val_data, test_data = prepare_dataset(
    data_dir='D:/codes/agriscan_dataset/dataset_diseases/cassava',
    img_size=(224, 224),
    batch_size=32,
    validation_split=0.2
)

# Step 2: Apply augmentation
train_data = train_data.map(
    lambda x, y: (data_augmentation(x, training=True), y)
)

# Step 3: Calculate class weights
class_weights = compute_class_weights(train_data)

# Step 4: Build model
model = build_model(num_classes=5)

# Step 5: Compile
model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-3),
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Step 6: Train (Phase 1: frozen base)
history1 = model.fit(
    train_data,
    validation_data=val_data,
    epochs=10,
    callbacks=[lr_scheduler]
)

# Step 7: Fine-tune (Phase 2: unfrozen top layers)
base_model = model.layers[1]  # Get base model
base_model.trainable = True
for layer in base_model.layers[:-20]:  # Freeze first layers
    layer.trainable = False

model.compile(
    optimizer=tf.keras.optimizers.Adam(1e-5),  # Lower LR
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

history2 = model.fit(
    train_data,
    validation_data=val_data,
    epochs=20,
    callbacks=[early_stopping]
)

# Step 8: Evaluate on test set
test_loss, test_acc = model.evaluate(test_data)
print(f"Test accuracy: {test_acc:.2%}")

# Step 9: Convert to TFLite
converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open('cassava_model.tflite', 'wb') as f:
    f.write(tflite_model)
```

---

## Expected Results

### Accuracy Targets

| Model | Classes | Expected Accuracy | Training Time |
|-------|---------|-------------------|---------------|
| crop_classifier | 8 | 98-99% | 30 min |
| cassava | 5 | 95-97% | 20 min |
| banana | 4 | 94-96% | 15 min |
| tomato | 4 | 95-97% | 20 min |
| potato_coffee | 6 | 93-95% | 30 min |
| corn_groundnuts | 9 | 92-94% | 40 min |
| bean | 4 | 94-96% | 20 min |

**Overall system accuracy**: 95%+ on disease classification

### Comparison

| Approach | Accuracy | Classes | Models |
|----------|----------|---------|--------|
| Current (wrong) | 99% | 8 (crops) | 1 |
| Proposed | 95%+ | 33 (diseases) | 9 |

**Key insight**: 95% on 33 disease classes is much more useful than 99% on 8 crop types!

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Training from scratch
```python
# DON'T DO THIS
model = build_model_from_scratch(num_classes=5)
# Accuracy: 70-80%
```

### ✅ Solution: Use transfer learning
```python
# DO THIS
base_model = tf.keras.applications.MobileNetV2(weights='imagenet', ...)
# Accuracy: 95%+
```

---

### ❌ Mistake 2: No data augmentation
```python
# DON'T DO THIS
train_data = train_data.map(lambda x, y: (x / 255.0, y))
# Model overfits, poor generalization
```

### ✅ Solution: Apply augmentation
```python
# DO THIS
train_data = train_data.map(
    lambda x, y: (data_augmentation(x, training=True), y)
)
# Better generalization, +5-10% accuracy
```

---

### ❌ Mistake 3: Ignoring class imbalance
```python
# DON'T DO THIS
model.fit(train_data, epochs=20)
# Minority classes perform poorly
```

### ✅ Solution: Use class weights
```python
# DO THIS
class_weights = compute_class_weights(train_data)
model.fit(train_data, class_weight=class_weights)
# Balanced performance across all classes
```

---

### ❌ Mistake 4: Too high learning rate
```python
# DON'T DO THIS
model.compile(optimizer=tf.keras.optimizers.Adam(1e-2))
# Loss oscillates, doesn't converge
```

### ✅ Solution: Use learning rate scheduling
```python
# DO THIS
lr_scheduler = callbacks.ReduceLROnPlateau(patience=3)
model.compile(optimizer=tf.keras.optimizers.Adam(1e-3))
# Smooth convergence, better final accuracy
```

---

## Training Checklist

### Before Training
- [ ] Dataset restructured into disease classes (33 classes)
- [ ] Images preprocessed (resized, normalized)
- [ ] Train/val/test split created (70/20/10)
- [ ] Class distribution analyzed
- [ ] Data augmentation pipeline ready

### During Training
- [ ] Using transfer learning (pre-trained base)
- [ ] Applying data augmentation
- [ ] Using class weights (if imbalanced)
- [ ] Learning rate scheduling enabled
- [ ] Early stopping configured
- [ ] Model checkpointing enabled
- [ ] Monitoring both train and val accuracy

### After Training
- [ ] Evaluate on test set (unseen data)
- [ ] Check per-class accuracy (confusion matrix)
- [ ] Convert to TFLite
- [ ] Quantize model (reduce size)
- [ ] Test on real-world images
- [ ] Compare with baseline

---

## Monitoring Training

### Key Metrics to Track

```python
# 1. Overall accuracy
train_accuracy = history.history['accuracy']
val_accuracy = history.history['val_accuracy']

# 2. Per-class accuracy (from confusion matrix)
cm = confusion_matrix(y_true, y_pred)
per_class_accuracy = cm.diagonal() / cm.sum(axis=1)

# 3. Top-3 accuracy (useful for similar diseases)
top3_acc = tf.keras.metrics.TopKCategoricalAccuracy(k=3)

# 4. Loss curves
train_loss = history.history['loss']
val_loss = history.history['val_loss']
```

### Signs of Problems

| Symptom | Problem | Solution |
|---------|---------|----------|
| Train acc >> Val acc | Overfitting | Add dropout, augmentation, more data |
| Train acc = Val acc = low | Underfitting | Use larger model, train longer |
| Val loss increasing | Overfitting | Early stopping, regularization |
| Loss oscillating | LR too high | Reduce learning rate |

---

## Advanced Techniques (Optional)

### 1. Test Time Augmentation (TTA)
```python
# Predict multiple augmented versions, average results
def predict_with_tta(model, image, n_aug=5):
    predictions = []
    for _ in range(n_aug):
        aug_image = augment(image)
        pred = model.predict(aug_image)
        predictions.append(pred)
    return np.mean(predictions, axis=0)

# Improvement: +1-2% accuracy
```

### 2. Mixup Augmentation
```python
# Blend two images and their labels
def mixup(x, y, alpha=0.2):
    lam = np.random.beta(alpha, alpha)
    index = np.random.permutation(len(x))
    mixed_x = lam * x + (1 - lam) * x[index]
    mixed_y = lam * y + (1 - lam) * y[index]
    return mixed_x, mixed_y

# Improvement: +1-3% accuracy
```

### 3. Label Smoothing
```python
# Prevent overconfident predictions
loss = tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1)

# Improvement: +0.5-1% accuracy, better calibration
```

---

## Quick Start Training Script

See `ml/train_multi_model.py` for a complete implementation that:
1. Trains all 9 models automatically
2. Uses best practices (transfer learning, augmentation, etc.)
3. Generates training reports
4. Converts to TFLite
5. Creates class maps and prevention info

---

## Summary: What to Train

### For Best Accuracy:

1. **Use 9-model architecture** (1 crop classifier + 8 disease models)
2. **Transfer learning** with MobileNetV2 or EfficientNet
3. **Data augmentation** (flip, rotate, brightness, contrast)
4. **Class balancing** (weights or oversampling)
5. **Learning rate scheduling** (ReduceLROnPlateau)
6. **Two-phase training** (freeze base → fine-tune top layers)
7. **Early stopping** (prevent overfitting)
8. **Proper preprocessing** (normalize, resize)

### Expected Results:
- **Crop classifier**: 98-99% accuracy
- **Disease models**: 93-97% accuracy each
- **Overall system**: 95%+ on disease classification
- **Model size**: 10-30MB per model (mobile-friendly)
- **Inference time**: <100ms per image

### Time Investment:
- **Training**: 4-6 hours (can run in parallel)
- **Implementation**: 1-2 days
- **Testing**: 1 day
- **Total**: 3-4 days to production-ready system

Your dataset is excellent - with the right training approach, you can achieve 95%+ accuracy!