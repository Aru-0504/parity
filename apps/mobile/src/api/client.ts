import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';

// Automatically detect host machine IP when running on physical device or emulator
const getApiBaseUrl = (): string => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:5000/api`;
  }
  return Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const mobileApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

let onUnauthorizedCallback: ((message: string) => void) | null = null;

export const setOnUnauthorized = (cb: (message: string) => void) => {
  onUnauthorizedCallback = cb;
};

// Inject JWT token from SecureStore (Android Keystore / iOS Keychain)
mobileApiClient.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Failed to read token from SecureStore', error);
  }
  return config;
});

// Response interceptor handling token expiration & error codes
mobileApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const code = error.response?.data?.code;
      const message =
        code === 'TOKEN_EXPIRED'
          ? 'Your session has expired. Please log in again.'
          : error.response?.data?.message || 'Unauthorized. Please log in.';

      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (e) {
        console.error('Failed to clear expired token from SecureStore', e);
      }

      if (onUnauthorizedCallback) {
        onUnauthorizedCallback(message);
      }
    }
    return Promise.reject(error);
  }
);
