# Agriscan

**Final Year Project - Victoria University**

Agriscan is a mobile application for plant disease scanning and treatment guidance, designed for Ugandan farmers. It features a React Native/Expo frontend with a FastAPI backend, utilizing TensorFlow Lite for on-device crop disease detection, PostgreSQL with PostGIS for geospatial data storage, and SMS-based authentication.

---

## Table of Contents

- [About the Project](#about-the-project)
- [Contributors](#contributors)
- [Tech Stack](#tech-stack)
- [Tools & Technologies Used](#tools--technologies-used)
- [Project Structure](#project-structure)
- [Screen Flow](#screen-flow)
- [Dataset & Models](#dataset--models)
- [Fallback System](#fallback-system)
- [Supported Crops](#supported-crops)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Guide](#detailed-setup-guide)
- [Testing](#testing)
- [Hosting & Deployment](#hosting--deployment)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Citation](#citation)

---

## About the Project

Agriscan addresses the critical need for early plant disease detection among smallholder farmers in Uganda. The app enables farmers to:

- Scan crop leaves using their phone camera
- Get instant disease diagnosis with confidence scores
- Receive treatment and prevention recommendations
- Track disease outbreaks in their area
- Access information offline in low-connectivity areas

The application uses machine learning to detect diseases across 8 crop types with 16 different disease classes, providing farmers with actionable insights to protect their harvests.

---

## Contributors

| Student Name | Registration Number | Programme |
|--------------|---------------------|-----------|
| MAJER JACOB | VU-BCS-2311-0602-DAY | BCS |
| FARAJA MAHA | VU-BCS-2307-0240-DAY | BCS |
| RICHARD OCHIENG | VU-BCS-2301-1052-DAY | BCS |
| MASEREKA LANDUS | VU-BIT-2037-0647-DAY | BIT |
| MUGISA ALVIN | VU-BCS-2411-0525-DAY | BCS |
| WAKALANGA DENIS ROGERS | VU-BCS-2403-0370-EVE | BCS |
| REBECCA PEMBA MOLE | VU-BIT-2201-1634-DAY | BIT |

**Supervisor:** Bazigu Alex  
**Institution:** Victoria University

---

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile framework
- **Expo SDK 56** - Development platform and build tooling
- **TypeScript** - Type-safe JavaScript
- **Expo Camera** - Camera access for leaf scanning
- **Expo Image Picker** - Gallery photo selection
- **Expo Image Manipulator** - Image resizing and preprocessing for ML inference
- **Expo Location** - GPS coordinates for disease mapping
- **Expo SQLite** - Local offline storage
- **Expo Secure Store** - Secure token storage
- **React Native SVG** - Vector graphics
- **Iconsax React Native** - Icon library
- **pako** - PNG decompression for image preprocessing
- **react-native-fast-tflite** - TFLite native runtime (optional, for on-device inference)

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy 2.0** - ORM for database operations
- **Pydantic** - Data validation
- **PostgreSQL 15** - Relational database
- **PostGIS 3.3** - Geospatial data extension
- **Redis 7** - Caching and session management
- **Python-JOSE** - JWT authentication
- **Passlib** - Password hashing (bcrypt)
- **TensorFlow Lite** - On-device ML inference
- **Pillow & NumPy** - Image processing

### Machine Learning
- **TensorFlow 2.x** - Deep learning framework
- **MobileNetV2** - Pre-trained base model (transfer learning)
- **TensorFlow Lite** - Optimized mobile inference

---

## Tools & Technologies Used

### Development Tools
- **Docker & Docker Compose** - Containerization and orchestration
- **npm** - Frontend package management
- **Python venv** - Backend virtual environment
- **Git** - Version control
- **VS Code** - Code editor

### Testing Tools
- **pytest** - Backend testing framework
- **TypeScript Compiler** - Frontend type checking

### Design & Prototyping
- **Figma** - UI/UX design and prototyping
  - [View Design File](https://www.figma.com/design/i1rdzTraE8t7mXiHDUVK7c/agriscan?node-id=0-1&t=BUGLesJd75OwV1QP-1)

### SMS Providers (Production)
- **Africa's Talking** - SMS service for Uganda
- **Twilio** - Alternative SMS provider
- **Firebase Cloud Messaging** - Push notifications (optional)

---

## Project Structure

```
Agriscan/
├── frontend/                          # React Native Expo app
│   ├── src/
│   │   ├── screens/                   # Screen components
│   │   │   ├── GetStartedScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── AddPhotoScreen.tsx
│   │   │   ├── ScanResultScreen.tsx
│   │   │   ├── TreatmentPreventionScreen.tsx
│   │   │   ├── HealthyScreen.tsx
│   │   │   └── auth/                  # Authentication screens
│   │   ├── services/                  # Business logic
│   │   │   ├── backendApi.ts         # Backend API calls
│   │   │   ├── tflite.ts             # Local ML inference
│   │   │   ├── db.ts                 # SQLite operations
│   │   │   └── sync.ts               # Offline sync
│   │   ├── components/                # Reusable UI components
│   │   ├── theme/                     # Styling and themes
│   │   ├── types/                     # TypeScript definitions
│   │   └── config/                    # Configuration files
│   ├── App.tsx                        # Main app entry point
│   ├── package.json                   # Dependencies
│   └── tsconfig.json                  # TypeScript config
│
├── backend/                           # FastAPI backend
│   ├── app/
│   │   ├── main.py                    # Application entry point
│   │   ├── config.py                  # Configuration settings
│   │   ├── database.py                # Database connection
│   │   ├── models.py                  # SQLAlchemy models
│   │   ├── schemas.py                 # Pydantic schemas
│   │   ├── crud.py                    # Database operations
│   │   ├── auth.py                    # Authentication logic
│   │   ├── routers/                   # API endpoints
│   │   │   ├── auth.py               # Auth endpoints
│   │   │   └── reports.py            # Report endpoints
│   │   ├── services/                  # Business services
│   │   │   ├── inference.py          # ML inference service
│   │   │   ├── sms.py                # SMS service
│   │   │   └── firebase_sms.py       # Firebase SMS integration
│   │   └── model_assets/              # ML model files
│   │       ├── agriscan_model.tflite # Current model
│   │       ├── class_map.json        # Class labels
│   │       └── pretrained/           # High-accuracy models
│   ├── tests/                         # Backend tests
│   │   └── test_sms_auth.py
│   ├── requirements.txt               # Python dependencies
│   ├── Dockerfile                     # Container definition
│   └── .env.example                   # Environment template
│
├── ml/                                # Machine Learning scripts
│   ├── train.py                       # Basic training script
│   ├── train_transfer_learning.py     # Transfer learning (MobileNetV2)
│   ├── preprocess_dataset.py          # Dataset preprocessing
│   ├── setup_pretrained_model.py      # Model setup utilities
│   └── backend/                       # ML backend integration
│
├── docker-compose.yml                 # Database & Redis orchestration
├── init-db.sql                        # Database initialization
├── render.yaml                        # Deployment configuration
└── README.md                          # This file
```

---

## Screen Flow

The application follows this user journey:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Get Started Screen                                      │
│     - Welcome message                                       │
│     - "Get Started" button                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Authentication Flow (SMS-based)                         │
│     - Enter phone number                                    │
│     - Receive verification code via SMS                     │
│     - Enter code to verify                                  │
│     - Auto-login with JWT token                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Home Screen (Main Dashboard)                            │
│     - Scan button (camera)                                  │
│     - Upload from gallery                                   │
│     - Recent scans history                                  │
│     - Statistics overview                                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Camera Screen / Add Photo Screen                        │
│     - Live camera view                                      │
│     - Capture leaf image                                    │
│     - OR select from gallery                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Scan Result Screen                                      │
│     - Disease detected / Healthy                            │
│     - Confidence score                                      │
│     - Severity level                                        │
│     - Crop type identified                                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌──────────────────────┐   ┌──────────────────────┐
│  Diseased            │   │  Healthy             │
│  - Treatment info    │   │  - Confirmation      │
│  - Prevention tips   │   │  - Continue farming  │
│  - Action steps      │   └──────────────────────┘
└──────────────────────┘
```

---

## Dataset & Models

### Dataset Source

The models are trained on the **PlantVillage Dataset**, a publicly available dataset containing:

- **38,000+ images** of healthy and diseased crop leaves
- **8 crop types** (Banana, Bean, Cassava, Coffee, Corn, Groundnuts, Potato, Tomato)
- **16 disease classes** plus healthy variants
- Images captured under controlled conditions with consistent lighting

**Dataset Citation:**
> Hughes, D. P., & Salathé, M. (2015). An open access repository of images on plant health to enable the development of mobile disease diagnostics. *arXiv preprint arXiv:1511.08060*.

### Model Architecture

#### Current Model (agriscan_model.tflite)
- **Architecture:** MobileNetV2 (Transfer Learning)
- **Base Model:** Pre-trained on ImageNet (1.4M images)
- **Custom Head:** Dense layers (128 units) with dropout
- **Input Size:** 224x224 pixels
- **Optimization:** Float16 quantization for mobile deployment

#### Model Performance

| Model | Training Data | Accuracy | Size | Use Case |
|-------|--------------|----------|------|----------|
| **Current (agriscan_model.tflite)** | Synthetic (random noise) | ~10% | ~50 MB | Development only |
| **Pretrained (plant_village_model.tflite)** | Real crop images (38K+) | **95-97%** | ~14 MB | Production |

**Note:** The current model in the repository was trained on synthetic data for development purposes. For production use, train the model using the PlantVillage dataset (see [Training Guide](#model-training)).

### Model Training

#### Option 1: Train on Kaggle (Recommended - Free GPU)

See **[KAGGLE_TRAINING_GUIDE.md](KAGGLE_TRAINING_GUIDE.md)** for step-by-step instructions.

**Benefits:**
- Free GPU (Tesla P100/P4)
- No local GPU required
- PlantVillage dataset pre-loaded
- Training time: 30-60 minutes
- Cost: $0

**Steps:**
1. Create Kaggle account
2. Create new notebook with GPU enabled
3. Add PlantVillage dataset
4. Run training code from `ml/train_transfer_learning.py`
5. Download trained model (~14 MB)
6. Deploy to `backend/app/model_assets/pretrained/`

#### Option 2: Train Locally

**Requirements:**
- GPU recommended (30-60 min training)
- 2.3 GB dataset download
- TensorFlow 2.10+

**Steps:**
```bash
# 1. Download PlantVillage dataset
# Available at: https://data.mendeley.com/datasets/tywbtsjrjv/1

# 2. Preprocess dataset
python ml/preprocess_dataset.py --input_dir ./plant_village --output_dir ./dataset

# 3. Train model
python ml/train_transfer_learning.py --data_dir ./dataset --epochs 10 --fine_tune

# 4. Model will be saved to ./tflite/plant_village_model.tflite
```

#### Option 3: Use Pre-trained Model

If you have a pre-trained TFLite model:
```bash
mkdir -p backend/app/model_assets/pretrained
cp /path/to/your/model.tflite backend/app/model_assets/pretrained/plant_village_model.tflite
cp /path/to/your/class_map.json backend/app/model_assets/pretrained/class_map.json
```

### Model Location

- **Current (low accuracy):** `backend/app/model_assets/agriscan_model.tflite`
- **Pretrained (high accuracy):** `backend/app/model_assets/pretrained/plant_village_model.tflite`
- **Class Map:** `backend/app/model_assets/class_map.json`

### Inference Process

1. Image is resized to 224x224 pixels
2. Preprocessed (normalized to [0, 255] range)
3. Fed to TFLite model
4. Model returns probability distribution over 16 classes
5. Highest probability class is selected
6. Disease label and severity are determined

### Local vs Backend Inference

The app supports both inference modes:

- **Local Inference (Offline):** TFLite model runs on device using `expo-tflite` or similar
- **Backend Inference (Online):** Image sent to FastAPI server for inference

This dual approach ensures the app works in low-connectivity areas.

---

## Fallback System

Agriscan implements a robust fallback system to ensure reliability:

### 1. Inference Fallback Chain
The scan flow uses a **two-tier inference system**:

1. **Frontend TFLite Models (PRIMARY)** - On-device inference using `.tflite` models from `frontend/assets/models/`
   - Gatekeeper model (`mobilenetv2_crop_gatekeeper.tflite`) identifies the crop type
   - Disease expert models (e.g. `banana_disease_expert.tflite`) classify the specific disease
   - Requires `react-native-fast-tflite` native runtime
   - Image preprocessing via `expo-image-manipulator` + `pako` (resize to 224x224, decode PNG, normalize to [-1, 1])

2. **Backend .keras Models (FALLBACK)** - If frontend TFLite is unavailable, the image is sent to the backend API
   - POST `/api/v1/reports/diagnose` with the image
   - Backend runs the `.keras`/`.tflite` models server-side
   - Returns crop type, disease label, confidence score, and severity

### 2. Offline Mode
- **Local Storage:** SQLite database stores scan history
- **Local Inference:** TFLite model runs on-device without internet
- **Sync Queue:** Scans are queued and synced when connection returns

### 3. Model Fallback
- If pretrained model fails to load, falls back to current model
- Graceful degradation with user notification
- Logs errors for debugging

### 4. SMS Fallback
- Multiple SMS providers supported (Africa's Talking, Twilio, Firebase)
- Mock provider for development/testing
- Automatic retry on failure

---

## Supported Crops

The application can detect diseases across **8 crop types** with **16 disease classes**:

### Banana
- Banana BBW (Bacterial Wilt)
- Banana Black Sigatoka
- Banana Healthy

### Bean
- Bean Angular Leaf Spot
- Bean Rust
- Bean Healthy

### Cassava
- Cassava Bacterial Blight
- Cassava Brown Spot
- Cassava CMD (Mosaic Disease)
- Cassava Green Mottle
- Cassava Healthy

### Coffee
- Coffee Rust
- Coffee Healthy

### Corn (Maize)
- Corn Common Rust
- Corn Gray Leaf Spot
- Corn Northern Leaf Blight
- Corn Healthy

### Groundnuts
- Groundnuts Early Leaf Spot
- Groundnuts Late Leaf Spot
- Groundnuts Healthy

### Potato
- Potato Early Blight
- Potato Late Blight
- Potato Healthy

### Tomato
- Tomato Bacterial Spot
- Tomato Early Blight
- Tomato Late Blight
- Tomato Leaf Mold
- Tomato Septoria Leaf Spot
- Tomato Spider Mites
- Tomato Target Spot
- Tomato Yellow Leaf Curl Virus
- Tomato Mosaic Virus
- Tomato Healthy

---

## Prerequisites

Before running the application, ensure you have:

- **Docker Desktop** - For PostgreSQL and Redis containers
- **Node.js 18+** - For frontend development
- **Python 3.11+** - For backend development
- **Expo Go app** - On your mobile device (iOS/Android) for testing
- **Git** - For version control
- **Kaggle account** (optional) - For training models with free GPU

---

## Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/mahafaraja/Aggriscan.git
cd Aggriscan
```

### 2. Start Database and Redis
```bash
docker-compose up -d db redis
```

### 3. Start Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Start Frontend
```bash
cd frontend
npm install
npx expo start
```

### 5. Run on Device
- Install **Expo Go** from App Store/Play Store
- Scan QR code from terminal
- App loads and connects to backend

---

## Detailed Setup Guide

### 1. Database and Redis Setup

The application uses PostgreSQL with PostGIS for geospatial data and Redis for caching.

**Start containers:**
```bash
docker-compose up -d db redis
```

**Verify containers are running:**
```bash
docker-compose ps
```

**View logs:**
```bash
docker-compose logs db
docker-compose logs redis
```

**Database connection details:**
- Host: `localhost:5432`
- Database: `agriscan`
- User: `postgres`
- Password: `postgrespassword`

**Redis connection details:**
- Host: `localhost:6379`
- No authentication required (development mode)

**Stop containers:**
```bash
docker-compose down
```

**Database initialization:**
The `init-db.sql` script runs automatically on first container start and creates necessary tables and spatial extensions.

### 2. Backend Setup

The backend is a FastAPI application that handles API requests, ML inference, and database operations.

**Setup virtual environment:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate  # Linux/Mac
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Configure environment variables:**
Create a `.env` file in the backend directory:
```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/agriscan
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SMS_PROVIDER=mock
```

**Run the backend server:**
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Verify backend is running:**
- Open browser to `http://localhost:8000`
- API documentation available at `http://localhost:8000/docs`
- Health check: `http://localhost:8000/`

**Test ML inference:**
```bash
cd backend
python test_inference.py
```

### 3. Frontend Setup

The frontend is a React Native app built with Expo for cross-platform mobile development.

**Install dependencies:**
```bash
cd frontend
npm install
```

**Configure API endpoint:**
The API URL is configured in `src/config/api.ts`. For local development:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

For a hosted backend:
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url
```

**Start development server:**
```bash
npx expo start
```

**Available commands:**
- `npx expo start` - Start development server
- `npx expo start --android` - Start with Android emulator
- `npx expo start --ios` - Start with iOS simulator
- `npx expo start --web` - Start web version

**TypeScript checking:**
```bash
npx tsc --noEmit
```

**Run on physical device:**
1. Install Expo Go app from App Store/Play Store
2. Connect device to same network as development machine
3. Scan QR code from Expo terminal
4. App will load and connect to backend

**Run on emulator:**
- Android: Start Android Studio emulator, press 'a' in Expo terminal
- iOS: Start iOS Simulator, press 'i' in Expo terminal

### 4. Docker Containerization

For production deployment, the backend can be containerized with Docker.

**Build backend image:**
```bash
docker-compose build backend
```

**Start all services:**
```bash
docker-compose up -d
```

**View running containers:**
```bash
docker-compose ps
```

**View backend logs:**
```bash
docker-compose logs -f backend
```

**Stop all services:**
```bash
docker-compose down
```

**Remove volumes:**
```bash
docker-compose down -v
```

---

## Testing

### Backend Testing

The backend uses **pytest** for testing.

**Run all tests:**
```bash
cd backend
pytest
```

**Run specific test file:**
```bash
pytest tests/test_sms_auth.py
```

**Run with verbose output:**
```bash
pytest -v
```

**Current Test Coverage:**
- SMS authentication flow
- Phone number format validation
- OTP verification

**Example Test:**
```python
# backend/tests/test_sms_auth.py
def test_demo_otp_accepts_common_uganda_phone_formats():
    service = SMSService()
    
    assert service.verify_code('+256762000000', '123456') is True
    assert service.verify_code('0762000000', '123456') is True
    assert service.verify_code('256762000000', '123456') is True
```

### Frontend Testing

The frontend currently uses **TypeScript** for type checking. No unit tests are implemented yet.

**Type checking:**
```bash
cd frontend
npx tsc --noEmit
```

**Recommended testing tools to add:**
- **Jest** - Unit testing framework
- **React Native Testing Library** - Component testing
- **Detox** - End-to-end testing

### ML Model Testing

**Test inference:**
```bash
cd backend
python test_inference.py
```

**Expected output:**
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

---

## Hosting & Deployment

### Local APK Build (No EAS Credits Required)

You can build the APK directly using Gradle on Windows:

```bash
cd frontend/android
gradlew.bat assembleRelease
```

The APK will be at: `frontend/android/app/build/outputs/apk/release/app-release.apk`

Or use the automated script:
```bash
cd frontend
build-apk.bat
# Select option 1 (Local Debug), 2 (Render Debug), or 3 (Render Release)
```

### Expo EAS Builds

The app can also be built and distributed using **Expo EAS (Expo Application Services)**.

**Build Profiles:**
- **Development:** For testing during development
- **Preview:** For internal testing and demos
- **Production:** For app store distribution

**To create a build:**
```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

### Backend Hosting

The backend can be deployed to various platforms:

#### Option 1: Render (Recommended)
- Uses `render.yaml` configuration
- Automatic deployments from GitHub
- Free tier available for testing

**Deployment:**
1. Connect GitHub repository to Render
2. Render automatically detects `render.yaml`
3. Deploys backend with PostgreSQL

#### Option 2: Railway
- Simple deployment from GitHub
- PostgreSQL included
- $5/month hobby plan

#### Option 3: AWS/GCP/Azure
- More control and scalability
- Requires infrastructure setup
- Suitable for production with high traffic

### Database Hosting

- **Development:** Docker containers (local)
- **Production:** 
  - Render PostgreSQL (included with backend)
  - AWS RDS
  - Google Cloud SQL
  - Supabase (PostgreSQL with extras)

---

## API Documentation

### Base URL
- Development: `http://localhost:8000`
- Production: `http://your-domain.com`

### Authentication Endpoints

#### Send SMS Verification Code
```http
POST /api/v1/auth/sms/send
Content-Type: application/json

{
  "phone_number": "+256700000001"
}
```

**Response:**
```json
{
  "message": "Verification code sent successfully"
}
```

#### Verify SMS Code and Login
```http
POST /api/v1/auth/sms/verify
Content-Type: application/json

{
  "phone_number": "+256700000001",
  "code": "123456"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### Register User (Password-based)
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "phone_number": "+256700000001",
  "password": "password123",
  "role": "farmer",
  "sub_county": "Mukono Town"
}
```

#### Login with Password
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone_number": "+256700000001",
  "password": "password123"
}
```

### Report Endpoints

#### Diagnose Crop Image
```http
POST /api/v1/reports/diagnose
Content-Type: multipart/form-data

file: <image_file>
```

**Response:**
```json
{
  "crop_type": "Cassava",
  "disease_label": "Cassava_CMD",
  "confidence_score": 0.95,
  "severity": "High",
  "detected_raw_crop": "cassava",
  "green_ratio": 0.85
}
```

#### Sync Offline Reports
```http
POST /api/v1/reports/sync
Authorization: Bearer <token>
Content-Type: application/json

[
  {
    "crop_type": "Cassava",
    "disease_label": "Cassava_CMD",
    "confidence_score": 0.95,
    "latitude": 0.3476,
    "longitude": 32.5825,
    "severity": "High",
    "offline_created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### Get Nearby Reports
```http
GET /api/v1/reports/nearby?latitude=0.3476&longitude=32.5825&radius_meters=5000
Authorization: Bearer <token>
```

#### Get Outbreak Hotspots
```http
GET /api/v1/reports/hotspots?radius_meters=2000&threshold_count=5
Authorization: Bearer <token>
```

---

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/agriscan

# Security
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# SMS Configuration
SMS_PROVIDER=mock  # Options: mock, africastalking, twilio, firebase

# Africa's Talking
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (optional)
FIREBASE_CREDENTIALS_PATH=./app/services/config/firebase_sms.json
```

### Frontend
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Troubleshooting

### Backend Issues

**Database connection failed:**
- Ensure Docker Desktop is running
- Check containers: `docker-compose ps`
- Restart containers: `docker-compose restart db`

**Port 8000 already in use:**
- Change port in uvicorn command: `--port 8001`
- Kill process using port 8000

**ML inference errors:**
- Verify model files exist in `backend/app/model_assets/`
- Check TensorFlow installation: `pip show tensorflow`
- If using pretrained model, ensure it's in `backend/app/model_assets/pretrained/`
- Run `python test_inference.py` to diagnose issues

**Low model accuracy (~10%):**
- The current model was trained on synthetic data
- Train a new model using Kaggle (see training guide above)
- Or use a pre-trained PlantVillage model

### Frontend Issues

**Expo cannot connect:**
- Ensure device and dev machine on same network
- Check firewall settings
- Try using LAN IP instead of localhost

**TypeScript errors:**
- Run: `npx tsc --noEmit`
- Check tsconfig.json configuration

**Metro bundler stuck:**
- Clear cache: `npx expo start -c`
- Restart terminal

### Docker Issues

**Container won't start:**
- Check Docker Desktop is running
- Verify no port conflicts
- View logs: `docker-compose logs <service>`

**Volume permission errors:**
- Reset volumes: `docker-compose down -v`
- Rebuild: `docker-compose up -d --build`

### SMS Issues

**Codes not sending:**
- Check SMS_PROVIDER setting
- Verify API keys for production providers
- Check console logs for mock provider

**Code verification fails:**
- Ensure correct code entered
- Check code hasn't expired (5 minutes)
- Verify phone number format (+256...)

---

## Citation

If you use this project or its components in your research or application, please cite:

### Project Citation
```bibtex
@misc{agriscan2024,
  title={Agriscan: A Mobile Application for Plant Disease Detection Using Deep Learning},
  author={Majer, Jacob and Maha, Faraja and Ochieng, Richard and Masereka, Landus and Mugisa, Alvin and Wakalanga, Denis Rogers and Mole, Rebecca Pemba},
  year={2024},
  publisher={Victoria University},
  note={Final Year Project}
}
```

### Dataset Citation
```bibtex
@article{hughes2015open,
  title={An open access repository of images on plant health to enable the development of mobile disease diagnostics},
  author={Hughes, David P and Salath{\'e}, Marcel},
  journal={arXiv preprint arXiv:1511.08060},
  year={2015}
}
```

### Model Citation
```bibtex
@misc{sandler2018mobilenetv2,
  title={MobileNetV2: Inverted Residuals and Linear Bottlenecks},
  author={Sandler, Mark and Howard, Andrew and Zhu, Menglong and Zhmoginov, Andrey and Chen, Liang-Chieh},
  year={2018},
  eprint={1801.04381},
  archivePrefix={arXiv},
  url={https://arxiv.org/abs/1801.04381}
}
```

---

## License

This project is developed as a final year project at Victoria University. All rights reserved.

---

## Contact

For questions, feedback, or collaboration inquiries, please contact the project team through Victoria University's computer science department.

**Supervisor:** Bazigu Alex  
**Institution:** Victoria University

---

## Acknowledgments

- **PlantVillage Dataset** - For providing the crop disease image dataset
- **Victoria University** - For supervision and resources
- **Uganda Farmers** - For domain knowledge and requirements
- **Open Source Community** - For the amazing tools and libraries

---

**Last Updated:** July 2024  
**Version:** 1.0.0