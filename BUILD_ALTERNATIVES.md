# Agriscan Build Alternatives - Complete Setup

## Overview

You've reached the maximum number of free builds on Expo EAS. This document provides a complete solution with **multiple build strategies** that don't consume EAS Build credits.

## What's Been Set Up

### ✅ 1. GitHub Actions CI/CD Workflow
**Location**: `.github/workflows/build.yml`

**Features**:
- Automated builds on every release tag (v*)
- Manual trigger via GitHub UI
- Builds both Android (APK + AAB) and iOS (IPA)
- 2000 free minutes/month
- Artifacts stored for 30 days

**How to Use**:
```bash
# Create a release tag
git tag v1.0.1
git push origin v1.0.1

# Download from GitHub → Actions → Artifacts
```

### ✅ 2. Local Build Scripts (Windows)
**Location**: `frontend/scripts/`

**Files**:
- `build-android-debug.bat` - Quick debug builds for testing
- `build-android-release.bat` - Optimized release builds for distribution
- `README.md` - Detailed script documentation

**How to Use**:
```bash
# Double-click the script or run:
frontend\scripts\build-android-release.bat
```

### ✅ 3. Comprehensive Documentation
**Files Created**:
- `BUILD_SETUP_GUIDE.md` - Complete guide with all build options
- `BUILD_QUICK_START.md` - Quick start guide (5-minute setup)
- `frontend/scripts/README.md` - Build scripts documentation

---

## Quick Comparison

| Feature | EAS Build (Old) | Local Builds | GitHub Actions |
|---------|----------------|--------------|----------------|
| **Cost** | 💰 $29/month | 🆓 FREE | 🆓 FREE |
| **Build Limit** | ❌ Limited | ✅ Unlimited | ✅ 2000 min/month |
| **Speed** | ⚡⚡ 5-10 min | ⚡⚡⚡ 2-5 min | ⚡⚡ 5-10 min |
| **Automation** | ✅ Yes | ❌ No | ✅ Yes |
| **Setup Effort** | ⚡ Easy | ⚡⚡ Medium | ⚡⚡ Medium |

**Winner**: Hybrid approach (Local + GitHub Actions) = FREE + Fast + Automated

---

## Implementation Steps

### Step 1: One-Time Setup (5 minutes)

```bash
# 1. Navigate to frontend
cd frontend

# 2. Generate native projects
eas build:configure

# 3. Install dependencies
npm install

# 4. Verify Android SDK is installed
#    (Install Android Studio if needed)
```

### Step 2: Test Local Build (2 minutes)

```bash
# Option A: Use the script (Windows)
frontend\scripts\build-android-release.bat

# Option B: Manual command
cd frontend\android
gradlew.bat assembleRelease
```

**Output**: `frontend\android\app\build\outputs\apk\release\app-release.apk`

### Step 3: Install on Device (1 minute)

```bash
# Connect device via USB with USB debugging enabled
adb install -r frontend\android\app\build\outputs\apk\release\app-release.apk
```

### Step 4: Set Up GitHub Actions (Optional, 10 minutes)

1. **Get EAS Token**:
   ```bash
   eas login
   # Token location: ~/.eas/config
   ```

2. **Add GitHub Secrets**:
   - Go to: GitHub Repo → Settings → Secrets → Actions
   - Add `EAS_TOKEN` (from step 1)
   - Add `FASTLANE_USER` (iOS only)
   - Add `FASTLANE_PASSWORD` (iOS only)

3. **Create First Release**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **Download Build**:
   - Go to: GitHub → Actions → Latest run
   - Download artifacts (APK/AAB/IPA)

---

## Build Workflows

### Development Workflow (Local Builds)

```bash
# Make code changes
# ...

# Build debug APK (fast)
frontend\scripts\build-android-debug.bat

# Install on device
adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk

# Test changes
# ...

# When ready for release:
git commit -am "feat: new feature"
git push
```

### Production Workflow (GitHub Actions)

```bash
# Update version in app.json
# Update CHANGELOG
# Commit all changes

git commit -am "chore: release v1.0.1"
git tag v1.0.1
git push origin v1.0.1

# GitHub Actions builds automatically
# Download from GitHub Actions artifacts
# Distribute to users
```

---

## File Structure

```
Agriscan/
├── .github/
│   └── workflows/
│       └── build.yml                    # ✅ NEW: GitHub Actions workflow
│
├── frontend/
│   ├── scripts/
│   │   ├── build-android-debug.bat      # ✅ NEW: Debug build script
│   │   ├── build-android-release.bat    # ✅ NEW: Release build script
│   │   └── README.md                    # ✅ NEW: Scripts documentation
│   │
│   ├── BUILD_SETUP_GUIDE.md             # ✅ NEW: Complete build guide
│   ├── BUILD_QUICK_START.md             # ✅ NEW: Quick start guide
│   ├── BUILD_WORKFLOW.md                # Existing: EAS workflow docs
│   ├── BUILD_OPTIMIZATION_SUMMARY.md    # Existing: Build optimizations
│   ├── eas.json                         # Existing: EAS configuration
│   ├── app.json                         # Existing: Expo configuration
│   └── package.json                     # Existing: Dependencies
│
└── BUILD_ALTERNATIVES.md                # ✅ NEW: This file
```

---

## Cost Savings

### Before (EAS Build Paid Plan)
- **Cost**: $29/month
- **Builds**: Unlimited
- **Total**: $348/year

### After (Local + GitHub Actions)
- **Cost**: $0/month
- **Builds**: Unlimited (local) + 2000 min/month (GitHub)
- **Total**: $0/year

**Savings**: $348/year 💰

---

## Common Use Cases

### Use Case 1: Daily Development
**Solution**: Local debug builds
```bash
frontend\scripts\build-android-debug.bat
adb install -r ...\app-debug.apk
```

### Use Case 2: Testing with QA Team
**Solution**: Local release build + distribute
```bash
frontend\scripts\build-android-release.bat
# Upload APK to Firebase App Distribution or send via email
```

### Use Case 3: Production Release
**Solution**: GitHub Actions
```bash
git tag v1.0.1
git push origin v1.0.1
# Download from GitHub Actions
# Upload to Google Play Store
```

### Use Case 4: Multiple Platform Builds
**Solution**: GitHub Actions with platform selection
```bash
# Go to GitHub → Actions → Build Agriscan App → Run workflow
# Select platform: android, ios, or all
```

---

## Environment Variables

### Required for Local Builds
```env
# Windows Environment Variables
ANDROID_HOME=C:\Users\YourName\AppData\Local\Android\Sdk
JAVA_HOME=C:\Program Files\Java\jdk-17
```

### Required for GitHub Actions
```env
# GitHub Secrets
EAS_TOKEN=expo_auth_token_here
FASTLANE_USER=your@apple.id (iOS only)
FASTLANE_PASSWORD=app-specific-password (iOS only)
```

### Required for App
```env
# frontend/.env
EXPO_PUBLIC_API_BASE_URL=https://aggriscan.onrender.com

# backend/.env
DATABASE_URL=your_database_url
FIREBASE_CREDENTIALS=your_firebase_credentials
GEMINI_API_KEY=your_gemini_api_key
```

---

## Troubleshooting

### Issue: "eas build:configure fails"
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
eas build:configure
```

### Issue: "gradlew is not recognized"
**Solution**:
```bash
# Make sure you're in the android directory
cd frontend\android
gradlew.bat assembleRelease
```

### Issue: "SDK not found"
**Solution**:
1. Install Android Studio
2. Open SDK Manager
3. Install "Android SDK Platform 36"
4. Set `ANDROID_HOME` environment variable

### Issue: "JAVA_HOME is not set"
**Solution**:
1. Install JDK 17
2. Set `JAVA_HOME` to: `C:\Program Files\Java\jdk-17`
3. Add to PATH: `%JAVA_HOME%\bin`

### Issue: "GitHub Actions build fails"
**Solution**:
1. Check `EAS_TOKEN` is set in GitHub secrets
2. Verify token is valid: `eas login`
3. Check build logs in GitHub Actions tab

---

## Migration from EAS Build

### If You Were Using EAS Build Before

1. **Stop using EAS Build**:
   ```bash
   # Don't run these anymore:
   # eas build --profile development
   # eas build --profile preview
   # eas build --profile production
   ```

2. **Use local builds instead**:
   ```bash
   # For development:
   frontend\scripts\build-android-debug.bat
   
   # For testing:
   frontend\scripts\build-android-release.bat
   ```

3. **Use GitHub Actions for production**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **Keep using EAS for other features**:
   ```bash
   # These are still FREE and useful:
   eas build:configure
   eas init
   eas login
   eas update --branch production  # OTA updates
   ```

---

## Benefits of This Setup

### ✅ No More Build Credit Limits
- Build as many times as you want locally
- 2000 free minutes/month on GitHub Actions

### ✅ Faster Development
- Local builds are 2-3x faster than EAS
- No waiting in queue
- Instant feedback

### ✅ Cost Effective
- $0/month vs $29/month
- Unlimited builds
- Free automation

### ✅ Full Control
- Customize build process
- Access to full build logs
- No black box

### ✅ Better CI/CD
- GitHub Actions integration
- Automated testing
- Deployment pipelines

---

## Next Steps

1. ✅ **Install Android Studio** (if not already installed)
2. ✅ **Run `eas build:configure`** to generate native projects
3. ✅ **Test a local build** using the scripts
4. ✅ **Install APK** on your device
5. ✅ **Set up GitHub Actions** (add secrets)
6. ✅ **Create first release** with git tag
7. ✅ **Update team** on new build process

---

## Support & Resources

### Documentation
- **[BUILD_SETUP_GUIDE.md](frontend/BUILD_SETUP_GUIDE.md)** - Complete guide
- **[BUILD_QUICK_START.md](frontend/BUILD_QUICK_START.md)** - Quick start
- **[scripts/README.md](frontend/scripts/README.md)** - Build scripts

### External Resources
- [Expo EAS CLI Docs](https://docs.expo.dev/eas/cli/)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Android Build Guide](https://developer.android.com/studio/build)
- [Gradle Docs](https://docs.gradle.org/current/userguide/userguide.html)

### Community
- [Expo Forums](https://forums.expo.dev/)
- [GitHub Issues](https://github.com/mahafaraja/Aggriscan/issues)

---

## Summary

You now have a **complete, free, and unlimited build system** for your Agriscan app:

- ✅ **Local builds** for fast development
- ✅ **GitHub Actions** for automated production builds
- ✅ **Comprehensive documentation** for your team
- ✅ **Helper scripts** for easy building
- ✅ **No more EAS Build credit limits!**

**Total cost**: $0/month  
**Total builds**: Unlimited  
**Automation**: Yes (via GitHub Actions)

---

## Questions?

If you have questions or need help:
1. Check the documentation files listed above
2. Review build logs for error messages
3. Ensure all prerequisites are installed
4. Open an issue on GitHub

---

**Last Updated**: 2026-07-23  
**Status**: ✅ Ready to use