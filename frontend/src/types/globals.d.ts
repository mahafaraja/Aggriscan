// Global type declarations for Expo/React Native

declare const __DEV__: boolean;

declare namespace NodeJS {
  interface ProcessEnv {
    readonly NODE_ENV: 'development' | 'production' | 'test';
    readonly EXPO_PUBLIC_API_BASE_URL?: string;
    [key: string]: string | undefined;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};