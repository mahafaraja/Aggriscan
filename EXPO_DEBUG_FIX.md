# Expo "Something Went Wrong" - Debug & Fix Guide

## Problem
- Expo shows "Something went wrong" error
- App reloads in infinite loop
- Cannot test the app

## Root Causes & Solutions

### 1. **Backend Not Running or Inaccessible**

**Check if backend is running:**
```bash
# Test backend health
curl https://aggriscan.onrender.com/

# Expected response:
# {"message": "Agriscan API is running"}

# If no response, backend is down
```

**Solution - Start backend locally:**
```bash
cd backend

# Activate virtual environment
.venv\Scripts\Activate.ps1  # Windows
# OR source .venv/bin/activate  # Mac/Linux

# Start backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# You should see:
# INFO:     Uvicorn running on http://0.0.0.0:8000
# INFO:     Loading pretrained (MobileNetV2 transfer learning)...
```

**Update frontend to use local backend:**
```bash
# In frontend directory, create .env file
echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:8000" > .env

# OR for Android emulator:
echo "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000" > .env

# OR for physical device (use your computer's IP):
echo "EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000" > .env
```

---

### 2. **Metro Bundler Cache Issues**

**Clear Metro cache:**
```bash
cd frontend

# Stop any running expo server (Ctrl+C)

# Clear cache
npx expo start -c

# Or manually:
npx expo start --clear
```

**If still issues, reset completely:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
```

---

### 3. **Missing Environment Variables**

**Create `.env` file in frontend directory:**
```bash
cd frontend

# Create .env file
cat > .env << EOF
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000
EOF

# For production backend:
# EXPO_PUBLIC_API_BASE_URL=https://aggriscan.onrender.com
```

**Verify `.env` is loaded:**
```typescript
// frontend/src/config/api.ts should read:
console.log('API URL:', API_BASE_URL);
```

---

### 4. **Network Connectivity Issues**

**Check firewall/antivirus:**
- Windows Defender Firewall might block ports
- Antivirus might block Node.js

**Solution:**
```bash
# Allow through firewall (Windows)
# 1. Open Windows Defender Firewall
# 2. Allow Node.js through firewall
# 3. Allow Python through firewall

# Or disable firewall temporarily for testing
```

**Test network connectivity:**
```bash
# From frontend, test if backend is reachable
curl http://localhost:8000/

# Should return:
# {"message": "Agriscan API is running"}
```

---

### 5. **Infinite Reload Loop - Common Causes**

#### Cause A: Syntax Error in Code
**Check for syntax errors:**
```bash
cd frontend
npx tsc --noEmit

# Fix any TypeScript errors
```

#### Cause B: Import Error
**Check imports in App.tsx:**
```typescript
// Make sure all imports are correct
import { setupAutoSync } from './src/services/sync';
// This file must exist!
```

#### Cause C: Missing Module
**Reinstall dependencies:**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

### 6. **Expo Go App Issues**

**Update Expo Go:**
- Download latest Expo Go from App Store/Play Store
- Clear Expo Go cache:
  - Android: Settings > Apps > Expo Go > Clear Cache
  - iOS: Delete and reinstall Expo Go

**Use different connection method:**
```bash
# Try tunnel mode (slower but more reliable)
npx expo start --tunnel

# Or LAN mode (faster)
npx expo start --lan
```

---

## Step-by-Step Fix

### Step 1: Verify Backend is Running
```bash
cd backend

# Check if backend is running
curl http://localhost:8000/

# If not running, start it:
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 2: Create Frontend `.env` File
```bash
cd frontend

# Create .env file with correct API URL
echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:8000" > .env

# For Android emulator:
# echo "EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000" > .env

# For physical device (replace with your IP):
# echo "EXPO_PUBLIC_API_BASE_URL=http://192.168.1.100:8000" > .env
```

### Step 3: Clear All Caches
```bash
cd frontend

# Stop any running expo server
# Press Ctrl+C

# Clear Metro bundler cache
npx expo start -c

# In another terminal, if still issues:
npm start -- --clear
```

### Step 4: Verify No Syntax Errors
```bash
cd frontend

# Check TypeScript
npx tsc --noEmit

# Should show no errors
```

### Step 5: Start Expo with Debug Logs
```bash
cd frontend

# Start with verbose logging
npx expo start --verbose

# Watch for errors in terminal
```

### Step 6: Test on Device/Emulator
```bash
# For Android emulator:
npx expo start --android

# For iOS simulator:
npx expo start --ios

# For physical device:
npx expo start
# Then scan QR code with Expo Go
```

---

## Common Error Messages & Fixes

### Error: "Network request failed"
**Cause**: Backend not running or wrong API URL

**Fix:**
```bash
# 1. Start backend
cd backend
uvicorn app.main:app --reload

# 2. Update .env in frontend
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000

# 3. Restart Expo
cd frontend
npx expo start -c
```

### Error: "Cannot find module './src/services/sync'"
**Cause**: File doesn't exist or wrong import

**Fix:**
```bash
# Verify file exists
ls frontend/src/services/sync.ts

# If missing, create it (see AUTH_AND_SCAN_FIXES.md)
```

### Error: "Something went wrong" (generic)
**Cause**: Usually a runtime error

**Fix:**
```bash
# 1. Check Metro bundler logs in terminal
# 2. Look for red error messages
# 3. Common issues:
#    - Missing import
#    - Syntax error
#    - TypeScript error
#    - Network error

# Enable debug mode:
npx expo start --dev-client
```

### Error: Infinite reload loop
**Cause**: Usually syntax error or import error

**Fix:**
```bash
# 1. Clear cache
npx expo start -c

# 2. Check for errors in terminal
# 3. Fix any import/syntax errors
# 4. Restart expo
```

---

## Debug Checklist

### Backend Checks
- [ ] Backend server is running (`uvicorn app.main:app --reload`)
- [ ] Backend accessible at `http://localhost:8000`
- [ ] Backend logs show no errors
- [ ] Database is running (PostgreSQL)
- [ ] Model files exist in `backend/app/model_assets/`

### Frontend Checks
- [ ] `.env` file exists in `frontend/` directory
- [ ] `EXPO_PUBLIC_API_BASE_URL` is set correctly
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All imports resolve correctly
- [ ] Metro cache cleared (`npx expo start -c`)
- [ ] Dependencies installed (`npm install`)

### Network Checks
- [ ] Firewall allows Node.js and Python
- [ ] Port 8000 not blocked
- [ ] Port 19000-19001 (Expo) not blocked
- [ ] Device/emulator can reach backend

---

## Quick Fix Script

Create `fix_expo.bat` (Windows) or `fix_expo.sh` (Mac/Linux):

**Windows (fix_expo.bat):**
```batch
@echo off
echo === Fixing Expo Issues ===

echo.
echo 1. Stopping any running servers...
taskkill /F /IM node.exe 2>nul
taskkill /F /IM python.exe 2>nul

echo.
echo 2. Clearing frontend cache...
cd frontend
rm -rf node_modules/.cache
rm -rf .expo

echo.
echo 3. Reinstalling dependencies...
npm install

echo.
echo 4. Starting backend...
cd ../backend
start "Backend" cmd /k "uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

echo.
echo 5. Starting Expo...
cd ../frontend
start "Expo" cmd /k "npx expo start -c"

echo.
echo === Done! ===
echo Backend: http://localhost:8000
echo Expo: Check the Expo window
echo.
pause
```

**Mac/Linux (fix_expo.sh):**
```bash
#!/bin/bash
echo "=== Fixing Expo Issues ==="

echo ""
echo "1. Stopping any running servers..."
pkill -f node
pkill -f python

echo ""
echo "2. Clearing frontend cache..."
cd frontend
rm -rf node_modules/.cache
rm -rf .expo

echo ""
echo "3. Reinstalling dependencies..."
npm install

echo ""
echo "4. Starting backend..."
cd ../backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo ""
echo "5. Starting Expo..."
cd ../frontend
npx expo start -c

# Cleanup
kill $BACKEND_PID
```

---

## Testing the Fix

### Test 1: Backend Health
```bash
curl http://localhost:8000/
# Should return: {"message": "Agriscan API is running"}
```

### Test 2: Frontend Connection
```bash
cd frontend
npx expo start -c

# Should show:
# ✓ Expo Go installed
# ✓ Ready in XXXms
# No errors!
```

### Test 3: App Loads
- Open Expo Go on device/emulator
- Scan QR code
- App should load without "Something went wrong"
- Should show Auth screen or Home screen (if logged in)

---

## Still Not Working?

### Check Logs
```bash
# Backend logs (in backend terminal)
# Should show:
# INFO: Uvicorn running on http://0.0.0.0:8000
# INFO: Loading pretrained (MobileNetV2 transfer learning)...

# Frontend logs (in frontend terminal)
# Should show:
# ✓ Ready in XXXms
# Metro waiting on exp://...

# Expo Go logs (shake device > Show Element Inspector > Console)
# Look for red error messages
```

### Common Issues
1. **Port 8000 already in use**
   ```bash
   # Change backend port
   uvicorn app.main:app --reload --port 8001
   # Update .env: EXPO_PUBLIC_API_BASE_URL=http://localhost:8001
   ```

2. **Database not running**
   ```bash
   # Start PostgreSQL
   docker-compose up -d db
   # OR start manually
   ```

3. **Model files missing**
   ```bash
   # Check model exists
   ls backend/app/model_assets/agriscan_model.tflite
   # If missing, see SETUP_GUIDE.md
   ```

---

## Summary

The "Something went wrong" error is usually caused by:
1. **Backend not running** → Start backend server
2. **Wrong API URL** → Update `.env` file
3. **Cache issues** → Clear with `npx expo start -c`
4. **Missing dependencies** → Run `npm install`
5. **Syntax errors** → Run `npx tsc --noEmit`

**Quick fix:**
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:8000" > .env
npx expo start -c
```

This should resolve the issue!