# Agriscan Build Setup Guide - No More Build Credits!

## Problem
You've reached the maximum number of free builds on Expo EAS. This guide provides alternative build strategies that don't consume EAS Build credits.

## Solutions

### Option 1: Local Builds (Recommended for Development)
Build directly on your machine using EAS prebuild + local Gradle/Xcode.

### Option 2: GitHub Actions CI/CD (Recommended for Production)
Free automated builds using GitHub's infrastructure (2000 minutes/month free).

### Option 3: Hybrid Approach
Use local builds for development, GitHub Actions for production releases.

---

## Option 1: Local Builds Setup

### Prerequisites
- **Android**: Android Studio installed with SDK
- **iOS**: Xcode installed (macOS only)
- **Node.js**: v18+ installed
- **EAS CLI**: `npm install -g eas-cli`

### Step 1: Generate Native Projects Locally

```bash
cd frontend

# Generate android/ and ios/ directories
eas build:configure

# This creates the native project structure
```

### Step 2: Build Android APK Locally

```bash
# Debug build (for testing)
cd frontend/android
./gradlew assembleDebug

# Release build (for distribution)
./gradlew assembleRelease

# Output location: android/app/build/outputs/apk/
```

### Step 3: Build iOS App Locally (macOS only)

```bash
cd frontend/ios
xcodebuild -workspace Agriscan.xcworkspace \
  -scheme Agriscan \
  -configuration Release \
  -derivedDataPath ./build
```

### Step 4: Create Helper Scripts

Create these scripts in `frontend/scripts/`:

#### `build-android-debug.sh` (Linux/Mac) or `build-android-debug.bat` (Windows)

```bash
#!/bin/bash
cd frontend
echo "Building Android Debug APK..."
cd android
./gradlew assembleDebug
echo "✓ APK built at: android/app/build/outputs/apk/debug/app-debug.apk"
```

#### `build-android-release.sh`

```bash
#!/bin/bash
cd frontend
echo "Building Android Release APK..."
cd android
./gradlew assembleRelease
echo "✓ APK built at: android/app/build/outputs/apk/release/app-release.apk"
```

#### `build-ios.sh` (macOS only)

```bash
#!/bin/bash
cd frontend
echo "Building iOS App..."
cd ios
xcodebuild -workspace Agriscan.xcworkspace \
  -scheme Agriscan \
  -configuration Release \
  -derivedDataPath ./build \
  -allowProvisioningUpdates
echo "✓ iOS app built at: ios/build/Build/Products/Release-iphoneos/Agriscan.app"
```

Make scripts executable:
```bash
chmod +x frontend/scripts/*.sh
```

---

## Option 2: GitHub Actions CI/CD (FREE!)

### Benefits
- ✅ **FREE** for public repos (2000 minutes/month)
- ✅ Automated builds on every release
- ✅ No build credit limits
- ✅ Cached builds for faster subsequent builds
- ✅ Build artifacts stored for 30 days

### Step 1: Create GitHub Actions Workflow

Create `.github/workflows/build.yml`:

```yaml
name: Build Agriscan App

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      platform:
        description: 'Platform to build'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - android
          - ios

jobs:
  build-android:
    runs-on: ubuntu-latest
    if: ${{ github.event.inputs.platform == 'all' || github.event.inputs.platform == 'android' || github.event_name == 'push' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'
      
      - name: Install Dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Setup EAS
        working-directory: frontend
        run: |
          npm install -g eas-cli
          eas login --token ${{ secrets.EAS_TOKEN }}
      
      - name: Prebuild Native Projects
        working-directory: frontend
        run: eas build:configure
      
      - name: Build Android APK
        working-directory: frontend/android
        run: ./gradlew assembleRelease
        env:
          JAVA_HOME: ${{ env.JAVA_HOME }}
      
      - name: Upload Android APK
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: frontend/android/app/build/outputs/apk/release/*.apk
          retention-days: 30
      
      - name: Upload Android App Bundle
        uses: actions/upload-artifact@v4
        with:
          name: android-aab
          path: frontend/android/app/build/outputs/bundle/release/*.aab
          retention-days: 30

  build-ios:
    runs-on: macos-latest
    if: ${{ github.event.inputs.platform == 'all' || github.event.inputs.platform == 'ios' || github.event_name == 'push' }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install Dependencies
        working-directory: frontend
        run: npm ci
      
      - name: Setup EAS
        working-directory: frontend
        run: |
          npm install -g eas-cli
          eas login --token ${{ secrets.EAS_TOKEN }}
      
      - name: Prebuild Native Projects
        working-directory: frontend
        run: eas build:configure
      
      - name: Build iOS App
        working-directory: frontend/ios
        run: |
          xcodebuild -workspace Agriscan.xcworkspace \
            -scheme Agriscan \
            -configuration Release \
            -derivedDataPath ./build \
            -allowProvisioningUpdates
        env:
          FASTLANE_USER: ${{ secrets.FASTLANE_USER }}
          FASTLANE_PASSWORD: ${{ secrets.FASTLANE_PASSWORD }}
      
      - name: Upload iOS IPA
        uses: actions/upload-artifact@v4
        with:
          name: ios-ipa
          path: frontend/ios/build/Build/Products/Release-iphoneos/*.ipa
          retention-days: 30
```

### Step 2: Configure GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:

1. **EAS_TOKEN**: Your Expo authentication token
   ```bash
   # Get your token
   eas login
   # Token is stored in ~/.eas/config
   ```

2. **FASTLANE_USER** (iOS only): Your Apple ID email
3. **FASTLANE_PASSWORD** (iOS only): Your Apple ID password (app-specific password recommended)

### Step 3: Create a Release Tag

```bash
git tag v1.0.1
git push origin v1.0.1
```

This triggers the GitHub Actions workflow automatically!

### Step 4: Download Builds

After the workflow completes:
1. Go to your GitHub repo → Actions
2. Click on the latest workflow run
3. Download artifacts (APK/AAB for Android, IPA for iOS)

---

## Option 3: Hybrid Approach (Best Practice)

### Development Workflow
```bash
# Local builds for quick testing
cd frontend/android
./gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Production Workflow
```bash
# Tag a release
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions builds automatically
# Download from GitHub Actions artifacts
```

---

## Environment Variables Setup

### Frontend `.env` file

Create `frontend/.env`:
```env
EXPO_PUBLIC_API_BASE_URL=https://agriscan.onrender.com
```

### Backend `.env` file

Ensure `backend/.env` has:
```env
DATABASE_URL=your_database_url
FIREBASE_CREDENTIALS=your_firebase_credentials
GEMINI_API_KEY=your_gemini_api_key
```

---

## Build Commands Cheat Sheet

### Local Development Builds
```bash
# Android Debug
cd frontend/android && ./gradlew assembleDebug

# Android Release
cd frontend/android && ./gradlew assembleRelease

# iOS Release (macOS only)
cd frontend/ios && xcodebuild -workspace Agriscan.xcworkspace -scheme Agriscan -configuration Release
```

### EAS Commands (No Build Credits!)
```bash
# Only use these for configuration, NOT building
eas build:configure
eas init
eas login
```

### GitHub Actions
```bash
# Trigger build manually
git tag v1.0.1
git push origin v1.0.1

# Or trigger via GitHub UI
# Go to Actions → Build Agriscan App → Run workflow
```

---

## Troubleshooting

### Local Build Issues

#### Android Gradle Build Fails
```bash
cd frontend/android
./gradlew clean
cd ..
npm install
eas build:configure
cd android
./gradlew assembleRelease
```

#### iOS Build Fails
```bash
cd frontend/ios
xcodebuild clean
cd ..
npm install
eas build:configure
cd ios
xcodebuild -workspace Agriscan.xcworkspace -scheme Agriscan -configuration Release
```

#### Node Modules Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### GitHub Actions Issues

#### Build Fails with "EAS_TOKEN invalid"
- Regenerate token: `eas login`
- Update GitHub secret with new token

#### iOS Build Fails with Signing Issues
- Ensure FASTLANE_USER and FASTLANE_PASSWORD are set
- Use app-specific password for Apple ID
- Check that your Apple Developer account is valid

#### Android Build Fails with Java Issues
- Ensure Java 17 is used (not Java 21)
- Check gradle.properties for correct settings

---

## Cost Comparison

| Method | Cost | Build Time | Automation |
|--------|------|------------|------------|
| EAS Build (Free tier) | 0 credits/month | ~5-10 min | ✅ Yes |
| EAS Build (Paid) | $29/month | ~5-10 min | ✅ Yes |
| Local Builds | FREE | ~2-5 min | ❌ No |
| GitHub Actions | FREE (2000 min) | ~5-10 min | ✅ Yes |
| **Hybrid** | **FREE** | **~2-10 min** | **✅ Yes** |

---

## Recommended Setup

### For Solo Development
1. Use **local builds** for day-to-day development
2. Use **GitHub Actions** for production releases

### For Team Development
1. Use **GitHub Actions** for all builds
2. Everyone downloads from GitHub Actions artifacts
3. No EAS Build credits needed!

### For Testing/QA
1. Build locally
2. Upload APK/IPA to Firebase App Distribution or TestFlight
3. Or use GitHub Releases to distribute builds

---

## Next Steps

1. ✅ Choose your build strategy (local, GitHub Actions, or hybrid)
2. ✅ Set up the required tools (Android Studio, Xcode, etc.)
3. ✅ Configure GitHub secrets (if using Actions)
4. ✅ Test a local build
5. ✅ Test a GitHub Actions build
6. ✅ Update your team on the new workflow

---

## Additional Resources

- [EAS CLI Documentation](https://docs.expo.dev/eas/cli/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Android Build Guide](https://developer.android.com/studio/build)
- [iOS Build Guide](https://developer.apple.com/documentation/xcode)
- [Expo Prebuild](https://docs.expo.dev/workflow/prebuild/)

---

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review build logs carefully
3. Ensure all prerequisites are installed
4. Verify environment variables are set correctly