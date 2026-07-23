# Build Scripts

This directory contains helper scripts for building the Agriscan app locally without using EAS Build credits.

## Available Scripts

### Windows
- `build-android-debug.bat` - Build debug APK for testing
- `build-android-release.bat` - Build release APK for distribution

## Usage

### Build Debug APK (Testing)
```bash
# Double-click the script or run from command line
frontend\scripts\build-android-debug.bat
```

Output: `frontend\android\app\build\outputs\apk\debug\app-debug.apk`

### Build Release APK (Distribution)
```bash
# Double-click the script or run from command line
frontend\scripts\build-android-release.bat
```

Output: `frontend\android\app\build\outputs\apk\release\app-release.apk`

## Prerequisites

Before using these scripts, ensure you have:

1. **Android Studio** installed with:
   - Android SDK
   - Android SDK Platform 36
   - Android SDK Build-Tools 36
   - Java JDK 17

2. **Environment Variables** set:
   - `ANDROID_HOME` - Path to Android SDK
   - `JAVA_HOME` - Path to JDK 17

3. **Native project generated**:
   ```bash
   cd frontend
   eas build:configure
   npm install
   ```

## Installation on Device

### Using ADB (Android Debug Bridge)
```bash
# Install debug APK
adb install -r frontend\android\app\build\outputs\apk\debug\app-debug.apk

# Install release APK
adb install -r frontend\android\app\build\outputs\apk\release\app-release.apk
```

### Manual Installation
1. Copy the APK file to your Android device
2. Enable "Install from unknown sources" in device settings
3. Tap the APK file to install

## Troubleshooting

### "gradlew is not recognized"
- Ensure you're in the `frontend\android` directory
- Use `gradlew.bat` instead of `gradlew` on Windows

### Build fails with "SDK not found"
- Install Android Studio
- Set `ANDROID_HOME` environment variable
- Accept Android SDK licenses: `sdkmanager --licenses`

### "JAVA_HOME is not set"
- Install JDK 17
- Set `JAVA_HOME` to JDK installation directory
- Add `%JAVA_HOME%\bin` to PATH

### Build fails with "Could not find dependencies"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
cd android
..\gradlew.bat clean
cd ..
eas build:configure
```

## Alternative: Manual Build Commands

If scripts don't work, use these commands directly:

### Debug Build
```bash
cd frontend\android
gradlew.bat assembleDebug
```

### Release Build
```bash
cd frontend\android
gradlew.bat assembleRelease
```

### Clean Build
```bash
cd frontend\android
gradlew.bat clean
gradlew.bat assembleRelease
```

## Notes

- **Debug builds** are larger and not optimized, but faster to build
- **Release builds** are optimized and smaller, suitable for distribution
- First build may take 5-10 minutes (downloads dependencies)
- Subsequent builds are faster (cached dependencies)
- Build outputs are in `frontend\android\app\build\outputs\`

## Next Steps

After building:
1. Test the APK on your device
2. If using GitHub Actions, commit and tag your release
3. Upload to Google Play Store or distribute to testers

## Support

For issues:
1. Check Android Studio logs
2. Review Gradle build output
3. Ensure all prerequisites are installed
4. Consult [BUILD_SETUP_GUIDE.md](../BUILD_SETUP_GUIDE.md)