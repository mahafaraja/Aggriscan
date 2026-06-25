# Agriscan

Agriscan is a mobile application for plant disease scanning and treatment guidance, designed for Ugandan farmers. It features a React Native/Expo frontend with a FastAPI backend, utilizing TensorFlow Lite for on-device crop disease detection, PostgreSQL with PostGIS for geospatial data storage, and SMS-based authentication.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Setup Guide](#detailed-setup-guide)
  - [1. Database and Redis Setup](#1-database-and-redis-setup)
  - [2. Backend Setup](#2-backend-setup)
  - [3. Frontend Setup](#3-frontend-setup)
  - [4. Docker Containerization](#4-docker-containerization)
- [API Documentation](#api-documentation)
- [SMS Authentication](#sms-authentication)
- [Crop Detection Model](#crop-detection-model)
- [Screen Flow](#screen-flow)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

## Tech Stack

### Frontend
- **React Native** - Mobile app framework
- **Expo SDK 56** - Development platform and tooling
- **TypeScript** - Type-safe development
- **Expo Camera** - Camera access for leaf scanning
- **Expo Image Picker** - Gallery photo selection
- **Expo Location** - GPS coordinates for disease mapping
- **Expo SQLite** - Local offline storage
- **Expo Secure Store** - Secure token storage
- **React Native SVG** - Vector graphics and icons
- **Iconsax React Native** - Icon library

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy 2.0** - ORM for database operations
- **Pydantic** - Data validation and settings
- **PostgreSQL 15 with PostGIS 3.3** - Geospatial database
- **Redis 7** - Caching and session management
- **Python-JOSE** - JWT token handling
- **Passlib** - Password hashing with bcrypt
- **TensorFlow Lite** - On-device ML inference
- **Pillow & NumPy** - Image processing

### Dev Tools
- **Docker & Docker Compose** - Containerization
- **npm** - Frontend package management
- **Python venv** - Backend virtual environment
- **pytest** - Testing framework
- **TypeScript** - Frontend type checking

## Project Structure

```
Agriscan/
├── frontend/                    # React Native Expo app
│   ├── src/
│   │   ├── screens/            # Screen components
│   │   │   ├── GetStartedScreen.tsx
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── CameraScreen.tsx
│   │   │   ├── AddPhotoScreen.tsx
│   │   │   ├── ScanResultScreen.tsx
│   │   │   ├── TreatmentPreventionScreen.tsx
│   │   │   ├── HealthyScreen.tsx
│   │   │   └── auth/           # Authentication screens
│   │   ├── services/           # Business logic
│   │   │   ├── backendApi.ts   # Backend API calls
│   │   │   ├── tflite.ts       # Local ML inference
│   │   │   ├── db.ts           # SQLite operations
│   │   │   └── sync.ts         # Offline sync
│   │   ├── components/         # Reusable components
│   │   ├── theme/              # Styling and themes
│   │   ├── types/              # TypeScript types
│   │   └── config/             # Configuration
│   ├── App.tsx                 # Main app component
│   ├── package.json
│   └── tsconfig.json
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── main.py             # Application entry point
│   │   ├── config.py           # Configuration settings
│   │   ├── database.py         # Database connection
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   ├── crud.py             # Database operations
│   │   ├── auth.py             # Authentication logic
│   │   ├── routers/            # API endpoints
│   │   │   ├── auth.py         # Auth endpoints
│   │   │   └── reports.py      # Report endpoints
│   │   ├── services/           # Business services
│   │   │   ├── inference.py    # ML inference service
│   │   │   └── sms.py          # SMS service
│   │   └── model_assets/       # ML model files
│   │       ├── agriscan_model.tflite
│   │       └── class_map.json
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml          # Container orchestration
├── init-db.sql                 # Database initialization
└── README.md
```

## Prerequisites

- **Docker Desktop** - For running PostgreSQL and Redis containers
- **Node.js 18+** - For frontend development
- **Python 3.11+** - For backend development
- **Expo Go app** - On your mobile device (iOS/Android)
- **Git** - For version control

## Quick Start

### 1. Start Database and Redis
```bash
docker-compose up -d db redis
```

### 2. Start Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1  # Windows
# source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Start Frontend
```bash
cd frontend
npm install
npx expo start
```

### 4. Run on Device
- Open Expo Go app on your phone
- Scan the QR code displayed in terminal
- App will load and connect to backend at `http://localhost:8000`

## Detailed Setup Guide

### 1. Database and Redis Setup

The application uses PostgreSQL with PostGIS extension for geospatial data and Redis for caching.

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
The API URL is configured in `src/config/api.ts`.
For local development, the default is:
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

For a hosted backend, set:
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

### 4. Build and Share the Android App

For a quick demo build, use Expo EAS:

```bash
cd frontend
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

Once the build completes, Expo will provide a link to install the app on an Android device or emulator.

**How to use the Expo build link:**
1. Open the build link on your phone or emulator.
2. Tap the install button.
3. Allow installation if Android asks for permission.
4. The app will appear in the app drawer like a normal installed app.

**Notes:**
- Preview builds are great for demos and testing.
- Production builds are recommended for wider distribution.
- The app is installed from the Expo build link, not from a local file in the project folder.

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

## SMS Authentication

The application supports SMS-based authentication for phone number verification.

### Configuration

Set the following environment variables in `backend/.env`:

```env
SMS_PROVIDER=mock  # Options: mock, africastalking, twilio

# For Africa's Talking
AFRICASTALKING_API_KEY=your-api-key
AFRICASTALKING_USERNAME=your-username

# For Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Providers

#### Mock Provider (Development)
- Logs verification codes to console
- No API keys required
- Default for development

#### Africa's Talking (Production)
- Requires API key and username
- Supports Uganda phone numbers
- Cost-effective for African markets

#### Twilio (Production)
- Requires Account SID, Auth Token, and phone number
- Global coverage
- Reliable delivery

### Flow

1. User enters phone number in app
2. Frontend calls `/api/v1/auth/sms/send`
3. Backend generates 6-digit code and sends via SMS
4. User enters received code
5. Frontend calls `/api/v1/auth/sms/verify`
6. Backend verifies code and issues JWT token
7. User is authenticated and can access protected endpoints

### Demo/Test Credentials

For demo purposes without using paid SMS services, use these test credentials:

- **Phone Number:** `+256762000000`
- **Verification Code:** `123456`

These credentials are hardcoded in the SMS service for development and demo purposes. In production, remove this bypass and use actual SMS providers.

## Crop Detection Model

The application uses a TensorFlow Lite model for crop disease detection.

### Supported Crops

The model can detect 8 crop types:
- Banana
- Bean
- Cassava
- Coffee
- Corn
- Groundnuts
- Potato
- Tomato

### Disease Mapping

Each crop has specific disease mappings:
- **Banana**: Banana_BBW (Banana Bunchy Top Disease)
- **Bean**: Bean_Angular_Leaf_Spot
- **Cassava**: Cassava_CMD (Cassava Mosaic Disease)
- **Coffee**: Coffee_Leaf_Rust
- **Corn**: Corn_Northern_Leaf_Blight
- **Groundnuts**: Groundnut_Rosette
- **Potato**: Potato_Late_Blight
- **Tomato**: Tomato_Early_Blight

### Model Location
- Backend: `backend/app/model_assets/agriscan_model.tflite`
- Class Map: `backend/app/model_assets/class_map.json`

### Inference Process

1. Image is resized to 224x224 pixels
2. Preprocessed and fed to TFLite model
3. Model returns probability distribution over 8 classes
4. Highest probability class is selected
5. Health analysis based on green color ratio
6. Disease label and severity are determined

### Local vs Backend Inference

The frontend supports both local TFLite inference (offline) and backend API inference (online). Local inference uses the same model architecture for offline capability.

## Screen Flow

The application follows this screen flow:

1. **Get Started Screen** - Welcome screen with "Welcome Samin!" message and "Get Start" button
2. **Home Screen** - Main dashboard with scan options and statistics
3. **Camera Screen** - Camera interface for live leaf scanning
4. **Add Photo Screen** - Gallery photo selection for diagnosis
5. **Scan Result Screen** - Displays disease detection results
6. **Treatment & Prevention Screen** - Shows treatment guidance (if diseased)
7. **Healthy Screen** - Confirmation screen for healthy leaves

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgrespassword@localhost:5432/agriscan
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
SMS_PROVIDER=mock
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

### Frontend
```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
```

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
- Check code hasn't expired
- Verify phone number format (+256...)
