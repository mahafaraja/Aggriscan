# Agriscan Build Quick Start Guide

## 🚀 No More EAS Build Credits!

You've hit the free build limit on Expo EAS. Here's how to build your app **for free** using local builds and GitHub Actions.

---

## ⚡ Quick Start (5 Minutes)

### Step 1: Generate Native Projects (One-time Setup)

```bash
cd frontend
eas build:configure
npm install
```

This creates the `android/` and `ios/` directories needed for building.

### Step 2: Build Your First APK (Windows)

**Option A: Use the script (easiest)**
```bash
# Double-click this file:
frontend\scripts\build-android-release.bat
```

**Option B: Manual command**
```bash
cd frontend\android
gradlew.bat assembleRelease
```

### Step 3: Install on Your Device

```bash
# Connect your Android device via USB
adb install -r frontend\android\app\build\outputs\apk\release\app-release.apk
```

**That's it!** You just built your first APK without using EAS Build credits. 🎉

---

## 📋 What You Get

### ✅ Local Builds (FREE)
- Build directly on your machine
- No build credit limits
- Fast builds (~2-5 minutes)
- Full control over build process

### ✅ GitHub Actions (FREE)
- Automated builds on every release
- 2000 free minutes/month
- No EAS Build credits needed
- Build artifacts stored for 30 days

### ✅ Hybrid Workflow
- Local builds for development
- GitHub Actions for production releases
- Best of both worlds!

---

## 🛠️ Prerequisites

### For Android Builds
1. **Android Studio** - https://developer.android.com/studio
2. **Java JDK 17** - https://adoptium.net/
3. **Environment Variables**:
   - `ANDROID_HOME` = `C:\Users\YourName\AppData\Local\Android\Sdk`
   - `JAVA_HOME` = `C:\Program Files\Java\jdk-17`

### For iOS Builds (macOS only)
1. **Xcode** - Install from App Store
2. **CocoaPods** - `sudo gem install cocoapods`

---

## 📱 Build Commands

### Android Debug (Testing)
```bash
cd frontend\android
gradlew.bat assembleDebug
```
Output: `app-debug.apk` (larger, not optimized)

### Android Release (Distribution)
```bash
cd frontend\android
gradlew.bat assembleRelease
```
Output: `app-release.apk` (smaller, optimized)

### iOS Release (macOS only)
```bash
cd frontend\ios
xcodebuild -workspace Agriscan.xcworkspace -scheme Agriscan -configuration Release
```

---

## 🔄 GitHub Actions Setup (Optional but Recommended)

### 1. Get Your EAS Token
```bash
eas login
# Token is saved in ~/.eas/config
```

### 2. Add GitHub Secrets
Go to: GitHub Repo → Settings → Secrets → Actions

Add these secrets:
- `EAS_TOKEN` - Your Expo token
- `FASTLANE_USER` - Your Apple ID (iOS only)
- `FASTLANE_PASSWORD` - Apple app-specific password (iOS only)

### 3. Create a Release
```bash
git tag v1.0.1
git push origin v1.0.1
```

### 4. Download Build
Go to: GitHub → Actions → Latest run → Download artifacts

---

## 📂 Project Structure

```
frontend/
├── scripts/
│   ├── build-android-debug.bat      # Build debug APK
│   ├── build-android-release.bat    # Build release APK
│   └── README.md                    # Scripts documentation
├── BUILD_SETUP_GUIDE.md             # Complete build guide
├── BUILD_QUICK_START.md             # This file
├── BUILD_WORKFLOW.md                # EAS workflow docs
├── BUILD_OPTIMIZATION_SUMMARY.md    # Build optimizations
├── eas.json                         # EAS configuration
├── app.json                         # Expo configuration
└── package.json                     # Dependencies

.github/
└── workflows/
    └── build.yml                    # GitHub Actions workflow
```

---

## 🆚 Build Methods Comparison

| Method | Cost | Speed | Automation | Best For |
|--------|------|-------|------------|----------|
| **Local Builds** | FREE | ⚡⚡⚡ Fast | ❌ Manual | Daily development |
| **GitHub Actions** | FREE | ⚡⚡ Medium | ✅ Automatic | Production releases |
| **EAS Build** | 💰 Paid | ⚡⚡ Medium | ✅ Automatic | If you have credits |

**Recommendation**: Use local builds for development, GitHub Actions for releases.

---

## 🐛 Troubleshooting

### "gradlew is not recognized"
```bash
# Make sure you're in the android directory
cd frontend\android
gradlew.bat assembleRelease
```

### "SDK not found"
1. Install Android Studio
2. Open SDK Manager
3. Install "Android SDK Platform 36"
4. Set `ANDROID_HOME` environment variable

### "JAVA_HOME is not set"
1. Install JDK 17
2. Set `JAVA_HOME` to: `C:\Program Files\Java\jdk-17`
3. Add to PATH: `%JAVA_HOME%\bin`

### Build fails with "Could not find dependencies"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
cd android
gradlew.bat clean
cd ..
eas build:configure
cd android
gradlew.bat assembleRelease
```

### GitHub Actions build fails
1. Check that `EAS_TOKEN` is set in GitHub secrets
2. Verify the token is valid: `eas login`
3. Check build logs in GitHub Actions tab

---

## 📚 Documentation

- **[BUILD_SETUP_GUIDE.md](BUILD_SETUP_GUIDE.md)** - Complete guide with all options
- **[BUILD_WORKFLOW.md](BUILD_WORKFLOW.md)** - EAS workflow documentation
- **[BUILD_OPTIMIZATION_SUMMARY.md](BUILD_OPTIMIZATION_SUMMARY.md)** - Build optimizations
- **[scripts/README.md](scripts/README.md)** - Build scripts documentation

---

## 🎯 Next Steps

1. ✅ **Install Android Studio** (if not already installed)
2. ✅ **Run `eas build:configure`** to generate native projects
3. ✅ **Try building** using the scripts
4. ✅ **Install APK** on your device
5. ✅ **Set up GitHub Actions** (optional, for automated builds)
6. ✅ **Create your first release** with a git tag

---

## 💡 Tips

- **First build is slow** - Downloads dependencies (~5-10 minutes)
- **Subsequent builds are fast** - Uses cached dependencies (~2-3 minutes)
- **Use debug builds** for testing - Faster to build
- **Use release builds** for distribution - Smaller and optimized
- **Clean builds** if you encounter issues: `gradlew.bat clean`

---

## 🆘 Need Help?

1. Check the **[BUILD_SETUP_GUIDE.md](BUILD_SETUP_GUIDE.md)** for detailed instructions
2. Review build logs for error messages
3. Ensure all prerequisites are installed
4. Verify environment variables are set correctly

---

## 🎉 You're Ready!

You now have a complete build setup that doesn't require EAS Build credits. Build as much as you want, for free!

**Happy Building! 🚀**