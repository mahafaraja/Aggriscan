// frontend/src/config/api.ts
//
// Default backend is the production Render backend.
// For local development against a local server, set the environment
// variable explicitly before bundling, e.g.:
//   EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:8000   (Android emulator)
//   EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000   (iOS / host)
//
// NOTE: Release builds must never fall back to localhost (127.0.0.1).
// On a device/emulator 127.0.0.1 maps to the device itself, not the host,
// so the request fails with:
//   java.net.ConnectException: failed to connect to /127.0.0.1:8000
const defaultApiUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  'https://aggriscan.onrender.com';

export const API_BASE_URL = defaultApiUrl;