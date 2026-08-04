# Agriscan: Model Integration Pipeline & App Architecture

## Table of Contents
1. [Model Integration: From Kaggle Dataset to .tflite](#model-integration)
2. [High-Level App Architecture](#app-architecture)
3. [App Features](#app-features)

---

## 1. Model Integration: From Kaggle Dataset to .tflite

### Overview
The Agriscan model (`agriscan_model.tflite`) is a TensorFlow Lite optimized model for on-device crop disease detection. It supports 8 crop types (Banana, Bean, Cassava, Coffee, Corn, Groundnuts, Potato, Tomato) with multiple disease classifications per crop.

### Step-by-Step Integration Pipeline

#### **Step 1: Dataset Acquisition**
- **Source**: PlantVillage dataset from Kaggle
- **Format**: Image classification dataset with folder-per-class structure
- **Original Classes**: 38+ classes (e.g., `Banana___Bacterial_Wilt`, `Cassava___Mosaic`, `Tomato___Healthy`)

#### **Step 2: Dataset Preprocessing**
**Script**: `ml/preprocess_dataset.py`

**Process**:
1. **Class Mapping**: Converts PlantVillage format to Agriscan format
   - Example: `Cassava___Mosaic` → `Cassava_CMD`
   - Example: `Banana___Bacterial_Wilt` → `Banana_BBW`
   - Example: `Tomato___Healthy` → `Tomato_Healthy`

2. **Crop Grouping**: Maps specific diseases to parent crop types
   ```python
   CROP_MAPPING = {
       'Banana___Bacterial_Wilt': 'banana',
       'Cassava___Mosaic': 'cassava',
       # ... 8 crop types total
   }
   ```

3. **Disease Severity Assignment**: Assigns severity levels (Low/Medium/High)
   ```python
   DISEASE_SEVERITY = {
       'Bacterial_Wilt': 'High',
       'Mosaic': 'High',
       'Healthy': 'Low',
       # ...
   }
   ```

4. **Output Structure**:
   ```
   ./dataset/
   ├── Banana_BBW/
   ├── Banana_Healthy/
   ├── Cassava_CMD/
   ├── Cassava_Healthy/
   └── ... (all mapped classes)
   ```

**Command**:
```bash
python ml/preprocess_dataset.py --input_dir ./plantvillage_raw --output_dir ./dataset
```

#### **Step 3: Model Training**
Two training approaches available:

##### **Option A: Custom Lightweight CNN (Original Model)**
**Script**: `ml/train.py`

**Architecture**:
- **Type**: Lightweight CNN with Depthwise Separable Convolutions
- **Input**: 224x224x3 RGB images
- **Layers**:
  - Data Augmentation (RandomFlip, RandomRotation, RandomZoom, RandomContrast)
  - Rescaling [0, 255] → [0, 1]
  - Conv2D (32 filters, stride 2)
  - SeparableConv2D (64, 128, 256 filters)
  - GlobalAveragePooling2D
  - Dense (128 units, ReLU)
  - Dropout (0.3, 0.2)
  - Output Dense (num_classes, logits)

**Training Configuration**:
- Optimizer: Adam (lr=0.001)
- Loss: SparseCategoricalCrossentropy (from_logits=True)
- Batch Size: 32
- Epochs: 15 (with EarlyStopping patience=5)
- Callbacks: ModelCheckpoint (save_best_only), EarlyStopping

**Output**: `./models/crop_disease_model.keras`

##### **Option B: Transfer Learning (Pretrained Model)**
**Script**: `ml/train_transfer_learning.py`

**Architecture**:
- **Base Model**: MobileNetV2 (pre-trained on ImageNet)
- **Input**: 224x224x3 RGB images
- **Preprocessing**: MobileNetV2 preprocessing [0, 255] range
- **Custom Head**:
  - GlobalAveragePooling from base
  - Dropout (0.3)
  - Dense (128 units, ReLU)
  - Dropout (0.2)
  - Output Dense (num_classes, softmax)

**Training Strategy**:
1. **Phase 1**: Freeze base model, train classifier head only (10 epochs)
2. **Phase 2 (Optional)**: Fine-tune top 100 layers of base model (5 epochs, lr=0.0001)

**Output**: `./tflite/plant_village_model.keras`

#### **Step 4: Model Conversion to .tflite**
**Function**: `convert_to_tflite()` in `ml/train.py` or `convert_to_tflite_optimized()` in `ml/train_transfer_learning.py`

**Conversion Process**:

1. **Float16 Quantization** (Primary):
   ```python
   converter = tf.lite.TFLiteConverter.from_keras_model(model)
   converter.optimizations = [tf.lite.Optimize.DEFAULT]
   converter.target_spec.supported_types = [tf.float16]
   tflite_fp16 = converter.convert()
   # Output: crop_disease_model_fp16.tflite
   ```

2. **INT8 Quantization** (Optional, requires calibration):
   ```python
   converter.representative_dataset = representative_dataset
   converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
   converter.inference_input_type = tf.uint8
   converter.inference_output_type = tf.uint8
   tflite_int8 = converter.convert()
   # Output: crop_disease_model_int8.tflite
   ```

3. **Fallback**: Dynamic Range Quantization if INT8 fails

**Output Files**:
- `crop_disease_model_fp16.tflite` (recommended)
- `crop_disease_model_int8.tflite` (smallest, if supported)
- `class_map.json` (class index to label mapping)

#### **Step 5: Model Deployment to Backend**
**Location**: `backend/app/model_assets/`

**Structure**:
```
backend/app/model_assets/
├── agriscan_model.tflite          # Original custom CNN model
├── class_map.json                 # Class label mappings
├── pretrained/
│   └── plant_village_model.tflite # MobileNetV2 transfer learning model
├── cassava_model/                 # Future: crop-specific models
├── coffe_model/
└── maize_model/
```

**Integration**: `backend/app/services/inference.py`

**Loading Process**:
1. Check for pretrained model first, fallback to original
2. Load TFLite model using TensorFlow Lite Interpreter
3. Allocate tensors
4. Extract input/output details (shape, dtype)

#### **Step 6: Inference Pipeline**
**Service**: `CropInferenceService` in `backend/app/services/inference.py`

**Inference Flow**:
```
Image Upload → Preprocessing → TFLite Inference → Post-processing → JSON Response
```

**Preprocessing**:
- Load image (PIL)
- Resize to 224x224
- Convert to numpy array [0, 255]
- Normalize to [0, 1]
- Add batch dimension (1, 224, 224, 3)

**Inference**:
```python
interpreter.set_tensor(input_details[0]['index'], img_array)
interpreter.invoke()
output_data = interpreter.get_tensor(output_details[0]['index'])[0]
```

**Post-processing**:
- Argmax to get predicted class index
- Map index to class label using `class_map.json`
- Calculate confidence score
- Determine disease severity (High/Medium/Low)
- For original model: Apply green ratio heuristic for health detection

**Output Format**:
```json
{
  "crop_type": "Cassava",
  "disease_label": "Cassava_CMD",
  "confidence_score": 0.92,
  "severity": "High",
  "detected_raw_crop": "Cassava_CMD",
  "model_used": "pretrained (MobileNetV2 transfer learning)"
}
```

#### **Step 7: Frontend Integration**
**Service**: `frontend/src/services/tflite.ts`

**Flow**:
1. User captures/selects image in app
2. Frontend sends image to backend API (`/api/v1/reports/diagnose`)
3. Backend runs TFLite inference
4. Backend returns diagnosis result
5. Frontend displays result with treatment recommendations

**Fallback**: Mock diagnostic generator for development when backend is unavailable

---

## 2. High-Level App Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────────┐
│                     Agriscan Mobile App                      │
│                    (React Native / Expo)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend Server                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ Auth Router  │  │Reports Router│  │ Inference Service│  │
│  └──────────────┘  └──────────────┘  └────────┬─────────┘  │
│                                                │             │
│  ┌─────────────────────────────────────────────▼─────────┐  │
│  │              TFLite Model Engine                      │  │
│  │   ┌─────────────────┐  ┌──────────────────────────┐  │  │
│  │   │ agriscan_model  │  │ plant_village_model       │  │  │
│  │   │   (CNN)         │  │   (MobileNetV2)           │  │  │
│  │   └─────────────────┘  └──────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │           MySQL Database                            │   │
│  │   ┌────────────┐  ┌────────────┐  ┌─────────────┐  │   │
│  │   │   Users    │  │  Reports   │  │ Sync Queue  │  │   │
│  │   └────────────┘  └────────────┘  └─────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SMS Notifications
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              Firebase Cloud Messaging / SMS                  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### **Frontend (Mobile App)**
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (stack-based)
- **State Management**: React hooks (useState, useEffect)
- **Local Storage**: Expo SecureStore (auth tokens), SQLite (offline reports)
- **Camera**: Expo Camera API
- **Image Handling**: Expo Image Picker
- **UI Components**: Custom components with theme system
- **Sync**: Auto-sync service for offline-first architecture

#### **Backend (API Server)**
- **Framework**: FastAPI (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: JWT tokens (phone number + password)
- **ML Engine**: TensorFlow Lite (Python)
- **File Upload**: Multipart form data
- **CORS**: Enabled for mobile app access
- **SMS**: Firebase Cloud Messaging / Twilio integration

#### **Machine Learning**
- **Framework**: TensorFlow / Keras
- **Model Format**: TensorFlow Lite (.tflite)
- **Quantization**: Float16 (primary), INT8 (optional)
- **Base Architectures**: 
  - Custom CNN (original)
  - MobileNetV2 (transfer learning, recommended)

### Data Flow

#### **Authentication Flow**
```
User Login → Frontend → Backend Auth Router → MySQL (verify credentials)
    → JWT Token → SecureStore → Authenticated Session
```

#### **Disease Diagnosis Flow**
```
1. User captures photo (CameraScreen)
2. Frontend uploads to backend (/api/v1/reports/diagnose)
3. Backend saves image to temp_uploads/
4. Inference Service loads TFLite model
5. Preprocess image (resize, normalize)
6. Run TFLite inference
7. Post-process results (severity, crop type)
8. Return JSON diagnosis
9. Frontend displays result (ScanResultScreen or HealthyScreen)
10. Save report to local SQLite
11. Auto-sync to backend in background
```

#### **Offline-First Architecture**
```
User Action → Local SQLite (immediate) → Background Sync → MySQL
    ↓
If offline: Queue in sync table
If online: Auto-sync every 5 minutes
```

---

## 3. App Features

### Core Features

#### **1. User Authentication**
- **Phone Number Registration**: Users sign up with phone number
- **Password Authentication**: Secure password hashing (bcrypt)
- **Role-Based Access**: 
  - Farmer (basic access)
  - Officer (extended features)
  - Admin (full access)
- **Session Management**: JWT tokens stored in SecureStore
- **Auto-Login**: Persistent authentication across app restarts

**Screens**: `AuthFlow.tsx`, `AuthScreens.tsx`

#### **2. Crop Disease Scanning**
- **Camera Capture**: Real-time camera integration
- **Gallery Upload**: Select existing photos
- **AI Diagnosis**: TFLite model inference on backend
- **Instant Results**: Confidence scores, disease labels, severity levels
- **Multi-Crop Support**: 8 crop types (Banana, Bean, Cassava, Coffee, Corn, Groundnuts, Potato, Tomato)

**Screens**: `CameraScreen.tsx`, `AddPhotoScreen.tsx`, `ScanResultScreen.tsx`, `HealthyScreen.tsx`

**Services**: `tflite.ts`, `backendApi.ts`

#### **3. Disease Information & Treatment**
- **Treatment Guides**: Detailed prevention and treatment recommendations
- **Disease Severity**: High/Medium/Low classification
- **Actionable Insights**: Step-by-step treatment plans
- **Prevention Tips**: Best practices for crop health

**Screens**: `TreatmentPreventionScreen.tsx`

**Services**: `treatmentGuide.ts`

#### **4. Scan History**
- **Historical Reports**: View past diagnoses
- **Date Filtering**: Browse scans by date
- **Detailed View**: Access full scan details and treatments
- **Offline Access**: History available without internet

**Screens**: `HistoryScreen.tsx`

**Services**: `db.ts` (SQLite), `sync.ts`

#### **5. Statistics & Analytics**
- **Scan Statistics**: Total scans, healthy vs. diseased ratio
- **Crop Distribution**: Most scanned crop types
- **Disease Trends**: Common diseases detected
- **Time-Based Analysis**: Scans over time

**Screens**: `StatisticsScreen.tsx`

#### **6. User Account Management**
- **Profile Information**: View and edit account details
- **Sub-County Location**: Geographic location for regional insights
- **Role Display**: Current user role and permissions
- **Account Settings**: Password change, preferences

**Screens**: `AccountInfoScreen.tsx`, `SettingsScreen.tsx`

#### **7. Offline Mode**
- **Local Storage**: SQLite database for offline reports
- **Auto-Sync**: Background sync when connection restored
- **Queue Management**: Pending uploads tracked in sync queue
- **Seamless Experience**: Full functionality without internet

**Services**: `db.ts`, `sync.ts`

#### **8. SMS Notifications**
- **Scan Alerts**: SMS notifications for critical disease detections
- **Treatment Reminders**: Follow-up notifications
- **Firebase Integration**: Cloud messaging for push notifications
- **Twilio Support**: SMS fallback for regions without internet

**Services**: `firebase_sms.py`, `sms.py`

### Screen Navigation Flow

```
┌──────────┐
│   Auth   │ (Login/Register)
└────┬─────┘
     │
     ▼
┌──────────┐
│   Home   │ ← Main dashboard with quick actions
└────┬─────┘
     │
     ├──────────────────┬──────────────────┬─────────────────┐
     ▼                  ▼                  ▼                 ▼
┌──────────┐    ┌──────────────┐   ┌──────────┐   ┌──────────────┐
│  Camera  │    │   History    │   │   Stats  │   │  Settings    │
└────┬─────┘    └──────────────┘   └──────────┘   └──────┬───────┘
     │                                                     │
     ▼                                                     ▼
┌──────────┐                                       ┌──────────────┐
│ Scan Result│                                      │ Account Info │
└────┬─────┘                                       └──────────────┘
     │
     ├──────────────────┐
     ▼                  ▼
┌──────────────┐  ┌──────────┐
│   Treatment  │  │ Healthy  │
│ Prevention   │  │ Screen   │
└──────────────┘  └──────────┘
```

### Key Components

#### **Sidebar Navigation**
- Quick access to Home, Statistics, Settings, Account Info
- Logout functionality
- Slide-in menu overlay

**Component**: `Sidebar.tsx`

#### **Theme System**
- Consistent color palette
- Typography scale
- Spacing and radius tokens
- Gradient definitions

**Location**: `frontend/src/theme/`

#### **API Configuration**
- Base URL configuration
- Endpoint definitions
- Request/response interceptors

**File**: `frontend/src/config/api.ts`

### Backend API Endpoints

#### **Authentication**
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user

#### **Reports**
- `POST /api/v1/reports/diagnose` - Upload image for diagnosis
- `GET /api/v1/reports/history` - Get user's scan history
- `GET /api/v1/reports/{id}` - Get specific report details
- `POST /api/v1/reports` - Create manual report

#### **Health**
- `GET /health` - Backend health check

### Database Schema

#### **Users Table**
```sql
- id (Primary Key)
- phone_number (Unique)
- password_hash
- role (farmer/officer/admin)
- sub_county
- created_at
- updated_at
```

#### **Reports Table**
```sql
- id (Primary Key)
- user_id (Foreign Key)
- image_path
- crop_type
- disease_label
- confidence_score
- severity
- detected_raw_crop
- green_ratio
- model_used
- synced (Boolean)
- created_at
- updated_at
```

#### **Sync Queue Table**
```sql
- id (Primary Key)
- report_id (Foreign Key)
- status (pending/synced/failed)
- retry_count
- created_at
```

### Model Assets Structure

```
backend/app/model_assets/
├── agriscan_model.tflite          # Original custom CNN (8 classes)
├── class_map.json                 # Class index → label mapping
├── pretrained/
│   └── plant_village_model.tflite # MobileNetV2 (38+ classes)
├── cassava_model/                 # Future specialized models
├── coffe_model/
└── maize_model/
```

### Development vs Production

#### **Development**
- Backend runs on `localhost:8000`
- CORS allows all origins
- Mock diagnostic fallback in frontend
- Synthetic dataset generation available
- Default seeded users for testing

#### **Production**
- Backend deployed (Render/AWS/GCP)
- CORS restricted to app domain
- Real TFLite inference only
- Production dataset from Kaggle
- Secure authentication with HTTPS

---

## Summary

The Agriscan app is a full-stack mobile application for crop disease detection using on-device machine learning. The model integration pipeline transforms the PlantVillage dataset from Kaggle into an optimized TFLite model through preprocessing, training, and quantization. The app provides an offline-first experience with camera-based scanning, AI-powered diagnosis, treatment recommendations, and historical tracking—all synchronized with a cloud backend for multi-device access and analytics.