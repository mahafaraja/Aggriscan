import 'dotenv/config';

const IS_LOCAL_BUILD = process.env.EAS_BUILD_PROFILE === 'local-backend';
const IS_RENDER_BUILD = process.env.EAS_BUILD_PROFILE === 'render-backend';
const IS_RELEASE = process.env.NODE_ENV === 'production' || process.env.APP_VARIANT === 'release';

export default {
  expo: {
    name: IS_LOCAL_BUILD ? 'Agriscan Local' : IS_RENDER_BUILD ? 'Agriscan Cloud' : 'Agriscan',
    slug: 'agriscan',
    version: '1.0.0',
    cli: {
      appVersionSource: 'local'
    },
    extra: {
      eas: {
        projectId: '03a79f6c-d066-476d-bca2-ddb2a659b8fc'
      },
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://aggriscan.onrender.com'
    },
    owner: 'faraja_maha',
    android: {
      package: IS_LOCAL_BUILD 
        ? 'com.agriscan.local' 
        : IS_RENDER_BUILD || IS_RELEASE
          ? 'com.agriscan.cloud' 
          : 'com.faraja_maha.agriscan',
      versionCode: IS_LOCAL_BUILD ? 100 : (IS_RENDER_BUILD || IS_RELEASE) ? 200 : 1,
      versionName: IS_LOCAL_BUILD ? '1.0.0-local' : (IS_RENDER_BUILD || IS_RELEASE) ? '1.0.0-cloud' : '1.0.0',
      icon: "./assets/icon.png",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    ios: {
      bundleIdentifier: IS_LOCAL_BUILD 
        ? 'com.agriscan.local' 
        : IS_RENDER_BUILD 
          ? 'com.agriscan.cloud' 
          : 'com.faraja-maha.agriscan',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true
        },
        NSCameraUsageDescription: "Allow Agriscan to access your camera to scan crop leaves for disease detection",
        NSLocationWhenInUseUsageDescription: "Allow Agriscan to access your location for geospatial disease mapping",
        NSLocationAlwaysAndWhenInUseUsageDescription: "Allow Agriscan to access your location for geospatial disease mapping",
        NSPhotoLibraryUsageDescription: "Allow Agriscan to access your photo library to select images for scanning",
        NSPhotoLibraryAddUsageDescription: "Allow Agriscan to save scanned images to your photo library",
        NSMicrophoneUsageDescription: "Allow Agriscan to access your microphone for audio features"
      }
    },
    plugins: [
      "expo-font",
      [
        "expo-splash-screen",
        {
          image: "./assets/icon.png",
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          imageWidth: 200
        }
      ],
      [
        "expo-build-properties",
        {
          android: {
            networkSecurityConfig: true,
            usesCleartextTraffic: true
          }
        }
      ]
    ],
    assetBundlePatterns: [
      "assets/**/*.png",
      "assets/**/*.jpg",
      "assets/**/*.jpeg",
      "assets/**/*.webp",
      "assets/**/*.svg",
      "assets/**/*.ttf"
    ]
  }
};