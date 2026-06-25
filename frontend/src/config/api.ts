
// frontend/src/config/api.ts
const defaultApiUrl = 'https://aggriscan.onrender.com';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || defaultApiUrl;