# Agriscan - Two Build Versions

## Quick Start

This project now supports building **two distinct versions** of the Agriscan app:

1. **Agriscan Local** (Build 100) - Development & Testing
2. **Agriscan Cloud** (Build 200) - Production & Beta Testing

---

## 🎯 What You Get

### Version 1: Agriscan Local
- **Package**: `com.agriscan.local`
- **Backend**: `http://127.0.0.1:8000` (localhost)
- **Build Number**: 100
- **Use Case**: Development, testing, demos
- **Features**: Full functionality with local backend

### Version 2: Agriscan Cloud
- **Package**: `com.agriscan.cloud`
- **Backend**: `https://aggriscan.onrender.com` (cloud)
- **Build Number**: 200
- **Use Case**: Production, beta testing
- **Features**: Full functionality with cloud backend

**Both versions can be installed simultaneously on the same device!**

---

## 🚀 Build Instructions

### One-Command Build

**For Windows:**
```bash
cd frontend
build.bat
```

**For Mac/Linux:**
```bash
cd frontend
chmod +x build.sh
./build.sh
```

Then select your option:
- **1** - Build Local Backend version
- **2** - Build Render Backend version
- **3** - Build both versions

### Manual Build

**Windows:**
```bash
cd frontend
eas build --platform android --profile local-backend --build-number 100
eas build --platform android --profile render-backend --build-number 200
```

**Mac/Linux:**
```bash
cd frontend
eas build --platform android --profile local-backend --build-number 100
eas build --platform android --profile render-backend --build-number 200
```

---

## 📋 Prerequisites

1. **EAS CLI installed**:
   ```bash
   npm install -g eas-cli
   ```

2. **Logged in to EAS**:
   ```bash
   eas login
   ```

3. **Dependencies installed**:
   ```bash
   cd frontend
   npm install
   ```

4. **For Local Backend version**:
   - Backend server running on `http://127.0.0.1:8000`
   - PostgreSQL running on port 5001
   - All models in `backend/app/model_assets/`

---

## 📁 Files Created

### Configuration Files
- ✅ `frontend/.env.local` - Local backend environment
- ✅ `frontend/.env.render` - Render backend environment
- ✅ `frontend/app.config.js` - Dynamic app configuration
- ✅ `frontend/eas.json` - EAS build profiles (updated)
- ✅ `frontend/build.sh` - Automated build script

### Documentation Files
- ✅ `INTEGRATION_AND_BUILD_CHECK.md` - Integration status & build guide
- ✅ `VERSION_SPECIFICATIONS.md` - Detailed version specs
- ✅ `BUILD_VERSIONS_SUMMARY.md` - Quick reference guide
- ✅ `README_BUILD_VERSIONS.md` - This file

---

## 🔍 Integration Status

### ✅ All Services Integrated

| Service | Status | Details |
|---------|--------|---------|
| Frontend-Backend API | ✅ | All endpoints connected |
| SMS Service (YoolaSMS) | ✅ | Configured & tested |
| Model Service (TFLite) | ✅ | Multi-model architecture |
| Plant ID (Gemini) | ✅ | API key configured |
| Authentication (JWT) | ✅ | SMS + JWT working |
| Database (PostgreSQL) | ✅ | Connection configured |
| CORS | ✅ | Mobile-ready |
| Offline Mode | ✅ | Sync implemented |

### ⚠️ Optional Services

| Service | Status | Action Required |
|---------|--------|-----------------|
| PlantID API | ⚠️ | Replace placeholder key |
| PlantNet API | ⚠️ | Replace placeholder key |

---

## 📱 Installation

### Local Backend Version

```bash
# 1. Start backend
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. Build app
cd frontend
./build.sh
# Select option 1

# 3. Install APK
adb install agriscan-local-100.apk

# 4. Test with demo credentials
# Phone: +256762000000
# Code: 123456
```

### Render Backend Version

```bash
# 1. Verify backend is deployed
curl https://aggriscan.onrender.com/health

# 2. Build app
cd frontend
./build.sh
# Select option 2

# 3. Install APK
adb install agriscan-cloud-200.apk

# 4. Test with real phone number
# SMS verification will work
```

---

## 🎨 Features

### Both Versions Include:
- ✅ SMS Verification (YoolaSMS)
- ✅ Crop Disease Diagnosis (TFLite)
- ✅ Plant Identification (Gemini AI)
- ✅ Care Recommendations
- ✅ PDF Report Generation
- ✅ Offline Mode
- ✅ Report Sync
- ✅ Geospatial Mapping
- ✅ Camera Integration
- ✅ Report History

---

## 📊 Version Comparison

| Feature | Local (100) | Cloud (200) |
|---------|-------------|-------------|
| Backend URL | localhost | Render Cloud |
| Database | Local PostgreSQL | Cloud PostgreSQL |
| Multi-User | ❌ | ✅ |
| Internet Required | Only for SMS | Yes |
| SSL/TLS | HTTP | HTTPS |
| Production Ready | ❌ | ✅ |
| Scalable | ❌ | ✅ |
| Demo Mode | ✅ | ❌ |

---

## 🧪 Testing

### Health Checks

```bash
# Local backend
curl http://127.0.0.1:8000/health

# Render backend
curl https://aggriscan.onrender.com/health

# Config check
curl https://aggriscan.onrender.com/health/config
```

### Demo Testing

**Local version supports demo mode:**
- Phone: `+256762000000`
- Code: `123456`
- No SMS charges

---

## 📚 Documentation

### Quick Reference
- **This file**: Quick start guide
- `BUILD_VERSIONS_SUMMARY.md`: Complete build guide
- `VERSION_SPECIFICATIONS.md`: Detailed specifications

### Technical Documentation
- `INTEGRATION_AND_BUILD_CHECK.md`: Integration status
- `frontend/app.config.js`: App configuration
- `frontend/eas.json`: Build profiles
- `backend/.env`: Backend configuration

---

## 🎯 Use Cases

### Development & Testing
**Use**: Local Backend (Build 100)
**Why**: Fast iteration, no cloud costs, demo mode

### Beta Testing
**Use**: Render Backend (Build 200)
**Why**: Real-world testing, multi-user support

### Production
**Use**: Render Backend (Build 200)
**Why**: Scalable, reliable, 24/7 availability

---

## ⚙️ Configuration

### Environment Variables

**Local Build** (`.env.local`):
```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
EXPO_PUBLIC_YOLLA_SMS_API_BASE=https://yoolasms.com/api/v1
EXPO_PUBLIC_YOLLA_SMS_API_KEY=your_api_key
```

**Render Build** (`.env.render`):
```env
EXPO_PUBLIC_API_BASE_URL=https://aggriscan.onrender.com
EXPO_PUBLIC_YOLLA_SMS_API_BASE=https://yoolasms.com/api/v1
EXPO_PUBLIC_YOLLA_SMS_API_KEY=your_api_key
```

### Backend Configuration

**Local** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres@127.0.0.1:5001/agriscan
GEMINI_API_KEY=your_gemini_key
YOLLA_SMS_API_KEY=your_sms_key
```

**Render** (Set in Render dashboard):
- Same variables, different values
- Database URL from Render PostgreSQL
- All API keys configured

---

## 🚦 Next Steps

1. ✅ **Configuration complete** - All files created
2. ⏭️ **Install EAS CLI** - `npm install -g eas-cli`
3. ⏭️ **Login to EAS** - `eas login`
4. ⏭️ **Build versions** - `./build.sh`
5. ⏭️ **Test on device** - Install and test
6. ⏭️ **Distribute** - Play Store or direct APK

---

## 🎉 Summary

You now have a complete setup for building **two versions** of the Agriscan app:

- ✅ **Local Backend Version** - For development and testing
- ✅ **Render Backend Version** - For production deployment
- ✅ **Unique package names** - Can install both simultaneously
- ✅ **Automated build script** - One command to build
- ✅ **Complete documentation** - All guides provided
- ✅ **Integration verified** - All services working

**Ready to build!** Run `./build.sh` to get started.

---

## 📞 Support

For issues or questions:
1. Check `INTEGRATION_AND_BUILD_CHECK.md` for integration issues
2. Check `VERSION_SPECIFICATIONS.md` for detailed specs
3. Check EAS dashboard for build issues
4. Check backend logs for API issues

---

**Built with ❤️ for Agriscan - Geospatial Epidemiological Backend for Cassava and Banana Crop Disease Diagnostics**