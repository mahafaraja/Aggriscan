import { Platform } from 'react-native';

// frontend/src/config/api.ts
const defaultApiUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  (__DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8000'
      : 'http://127.0.0.1:8000'
    : 'https://aggriscan.onrender.com');

export const API_BASE_URL = defaultApiUrl;