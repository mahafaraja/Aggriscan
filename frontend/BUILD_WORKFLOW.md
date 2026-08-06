# Agriscan EAS Build Workflow

## Overview
This document outlines the complete build and deployment workflow for the Agriscan app using Expo Application Services (EAS).

## Prerequisites
- Expo CLI installed: `npm install -g eas-cli`
- EAS account configured: `eas login`
- Project linked to EAS: `eas init` (already done)

## Build Workflow

### 1. Initial Development Build (One-time)
Install a development build on your physical device:
```bash
cd frontend
eas build --profile development
```
This creates a development client with hot reloading support.

### 2. Start Development Server
Start the Expo dev server with dev client support:
```bash
npx expo start --dev-client
```
- Scan the QR code with your development build app
- Make changes to the code
- See changes instantly on your phone (Fast Refresh enabled)

### 3. Build for Testers (Preview)
When ready to share with testers:
```bash
eas build --profile preview
```
This creates an APK (Android) that can be shared directly with testers.

### 4. Production Release
When ready to release to app stores:
```bash
eas build --profile production
```
This creates:
- Android: App Bundle (.aab) for Google Play Store
- iOS: Archive for App Store Connect

### 5. Post-Release Updates
For small JS fixes without rebuilding the native app:
```bash
eas update --branch production
```

## Build Profiles

### Development Profile
- **Purpose**: Local development with hot reloading
- **Distribution**: Internal (Expo Go or development build)
- **iOS**: Physical device only (simulator: false)
- **Features**: Debugging enabled, development client

### Preview Profile
- **Purpose**: Testing with stakeholders/QA
- **Distribution**: Internal
- **Android**: APK format (direct install)
- **iOS**: Simulator build
- **Features**: Production-like, no debugging

### Production Profile
- **Purpose**: App store release
- **Distribution**: Public
- **Android**: App Bundle (.aab) for Google Play
- **iOS**: Archive for App Store Connect
- **Features**: Optimized, minified, production-ready

## Recent Changes

### 1. Fixed Android Network Security Error
- **File**: `src/config/api.ts`
- **Issue**: CLEARTEXT communication to localhost not permitted
- **Fix**: 
  - Corrected ternary operator logic
  - Fixed production/development URL assignment
  - Added network security configuration in app.json

### 2. Updated App Icon
- **File**: `app.json`
- **Change**: Set icon.svg as primary app icon
- **Android**: Uses icon.svg with adaptive-icon.png for Android 8.0+
- **iOS**: Uses icon.svg

### 3. Added Animated Splash Screen
- **New File**: `src/components/AnimatedSplashScreen.tsx`
- **Features**:
  - Logo fade-in animation
  - Scale animation (0.5x to 1x)
  - Slide-up animation
  - Auto-hides after animation completes
  - Loads custom fonts (Poppins family)
- **Integration**: Added to App.tsx, shows before auth check

### 4. Updated EAS Configuration
- **File**: `eas.json`
- **Added**: iOS build configurations for all profiles
- **Production**: App bundle for Android, archive for iOS

## Project Structure

```
frontend/
├── app.json                 # Expo config (icons, splash, plugins)
├── eas.json                 # EAS build profiles
├── package.json             # Dependencies (expo-splash-screen added)
├── App.tsx                  # Main app with splash screen
├── src/
│   ├── components/
│   │   ├── AnimatedSplashScreen.tsx  # NEW: Animated splash
│   │   └── BrandLogo.tsx             # Logo component
│   ├── config/
│   │   └── api.ts          # API configuration (fixed)
│   └── screens/
│       └── auth/
│           └── AuthFlow.tsx
└── assets/
    ├── icon.svg            # App icon
    ├── adaptive-icon.png   # Android adaptive icon
    └── fonts/              # Poppins font family
```

## Environment Variables

Create a `.env` file in the frontend directory:
```env
EXPO_PUBLIC_API_BASE_URL=https://aggriscan.onrender.com
```

This overrides the default API URL in all environments.

## Troubleshooting

### Build Fails
- Check EAS build logs: `eas build:list`
- Ensure all dependencies are installed: `npm install`
- Clear cache: `expo start -c`

### Splash Screen Not Showing
- Ensure expo-splash-screen is installed
- Check that icon.svg exists in assets folder
- Rebuild the app after changes to splash configuration

### Network Errors
- Verify API_BASE_URL in src/config/api.ts
- For development: Uses localhost (10.0.2.2 for Android emulator)
- For production: Uses https://aggriscan.onrender.com
- Network security config allows cleartext for localhost

## Next Steps

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Create development build:
   ```bash
   eas build --profile development
   ```

3. Start development server:
   ```bash
   npx expo start --dev-client
   ```

4. Scan QR code and start developing!

## Resources
- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Splash Screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [Expo Build Properties](https://docs.expo.dev/versions/latest/sdk/build-properties/)