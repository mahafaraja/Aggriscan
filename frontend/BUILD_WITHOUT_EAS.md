# Building Agriscan APK Without EAS (Windows)

## Overview

Since EAS local builds require macOS/Linux and you've hit the free build limit, this guide shows how to build the APK directly using Gradle on Windows.

---

## Prerequisites

1. **Java Development Kit (JDK) 17**
   - Download from: https://adoptium.net/
   - Install and set JAVA_HOME environment variable

2. **Android Studio**
   - Download from: https://developer.android.com/studio
   - Install with Android SDK

3. **Node.js and npm**
   - Already installed (you have EAS CLI)

4. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

---

## Step-by-Step Build Process

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Configure Environment

**For Local Backend Version:**
```bash
copy .env.local .env
```

**For Render Backend Version:**
```bash
copy .env.render .env
```

### Step 3: Pre-build (Generate Android Project)

```bash
npx expo prebuild --platform android
```

This generates the `android` folder with Gradle build files.

### Step 4: Modify Package Name

The package name is controlled by `app.config.js`. After running prebuild, you need to modify the generated Android project.

**For Local Backend (com.agriscan.local):**

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.agriscan.local">
```

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.agriscan.local"
        versionCode 100
        versionName "1.0.0-local"
    }
}
```

**For Render Backend (com.agriscan.cloud):**

Edit `android/app/src/main/AndroidManifest.xml`:
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.agriscan.cloud">
```

Edit `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        applicationId "com.agriscan.cloud"
        versionCode 200
        versionName "1.0.0-cloud"
    }
}
```

### Step 5: Build APK

Open a terminal in the `frontend/android` folder:

```bash
cd frontend/android
```

**For Debug APK (testing):**
```bash
gradlew assembleDebug
```

**For Release APK (distribution):**
```bash
gradlew assembleRelease
```

### Step 6: Locate the APK

After build completes, find your APK at:

**Debug:**
```
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

**Release:**
```
frontend/android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Note:** The release APK needs to be signed before installation.

---

## Quick Build Script (Windows)

Create a batch file `build-apk.bat` in the `frontend` folder:

```batch
@echo off
echo =========================================
echo Agriscan APK Build Script (No EAS)
echo =========================================
echo.

set /p version=Enter version (local/render): 

if "%version%"=="local" (
    echo Building Local Backend Version...
    copy .env.local .env
    goto build
)

if "%version%"=="render" (
    echo Building Render Backend Version...
    copy .env.render .env
    goto build
)

echo Invalid choice
pause
exit /b 1

:build
echo.
echo Step 1: Installing dependencies...
call npm install

echo.
echo Step 2: Generating Android project...
call npx expo prebuild --platform android

echo.
echo Step 3: Configuring package name...
if "%version%"=="local" (
    powershell -Command "(Get-Content android\app\src\main\AndroidManifest.xml) -replace 'package=\"com.faraja_maha.agriscan\"', 'package=\"com.agriscan.local\"' | Set-Content android\app\src\main\AndroidManifest.xml"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'applicationId \"com.faraja_maha.agriscan\"', 'applicationId \"com.agriscan.local\"' | Set-Content android\app\build.gradle"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionCode 1', 'versionCode 100' | Set-Content android\app\build.gradle"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionName \"1.0.0\"', 'versionName \"1.0.0-local\"' | Set-Content android\app\build.gradle"
) else (
    powershell -Command "(Get-Content android\app\src\main\AndroidManifest.xml) -replace 'package=\"com.faraja_maha.agriscan\"', 'package=\"com.agriscan.cloud\"' | Set-Content android\app\src\main\AndroidManifest.xml"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'applicationId \"com.faraja_maha.agriscan\"', 'applicationId \"com.agriscan.cloud\"' | Set-Content android\app\build.gradle"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionCode 1', 'versionCode 200' | Set-Content android\app\build.gradle"
    powershell -Command "(Get-Content android\app\build.gradle) -replace 'versionName \"1.0.0\"', 'versionName \"1.0.0-cloud\"' | Set-Content android\app\build.gradle"
)

echo.
echo Step 4: Building APK...
cd android
call gradlew assembleDebug
cd ..

echo.
echo =========================================
echo Build completed!
echo =========================================
echo.
echo APK location: android\app\build\outputs\apk\debug\app-debug.apk
echo.
pause
```

---

## Alternative: Use Expo Development Build

If you want a simpler approach, use Expo's development build:

```bash
# For local backend
cd frontend
copy .env.local .env
npx expo run:android

# For render backend
cd frontend
copy .env.render .env
npx expo run:android
```

This will build and install the app directly on your connected Android device.

---

## Signing the Release APK (Optional)

If you need a signed release APK for distribution:

1. **Generate a keystore:**
   ```bash
   keytool -genkey -v -keystore agriscan.keystore -keyalg RSA -keysize 2048 -validity 10000 -alias agriscan
   ```

2. **Configure signing in `android/app/build.gradle`:**
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('agriscan.keystore')
               storePassword 'your-store-password'
               keyAlias 'agriscan'
               keyPassword 'your-key-password'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled false
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build signed APK:**
   ```bash
   cd frontend/android
   gradlew assembleRelease
   ```

---

## Troubleshooting

### Issue: JAVA_HOME not set
**Solution:** Set JAVA_HOME environment variable to your JDK installation path (e.g., `C:\Program Files\Java\jdk-17`)

### Issue: Gradle build fails
**Solution:** 
- Ensure Android Studio is installed
- Open `android` folder in Android Studio and let it sync
- Try `gradlew clean` then rebuild

### Issue: expo prebuild fails
**Solution:**
- Ensure you're in the `frontend` directory
- Delete `android` folder and try again
- Run `npm install` first

---

## Comparison: EAS vs Local Build

| Feature | EAS Cloud | EAS Local | Gradle Local |
|---------|-----------|-----------|--------------|
| Platform | Cloud | macOS/Linux only | Windows ✅ |
| Cost | Free tier limited | Free | Free ✅ |
| Setup | Easy | Moderate | Moderate |
| Build Time | 5-10 min | 5-10 min | 2-5 min ✅ |
| Control | Limited | Moderate | Full ✅ |
| Signing | Automatic | Automatic | Manual |

---

## Recommendation

Since you're on Windows and have hit EAS limits:

1. **For Testing:** Use `npx expo run:android` (easiest)
2. **For Distribution:** Use Gradle build script above
3. **For Future:** Consider upgrading EAS or using GitHub Actions for cloud builds

---

## Quick Start

**Fastest way to build on Windows:**

```bash
cd frontend
copy .env.local .env
npm install
npx expo prebuild --platform android
cd android
gradlew assembleDebug
```

Your APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Next Steps

1. Install JDK 17 and Android Studio
2. Set JAVA_HOME environment variable
3. Run the build script
4. Install APK on your device
5. Test with local backend

**Note:** You'll need to repeat the build process for each version (local vs render) by changing the `.env` file and package name.