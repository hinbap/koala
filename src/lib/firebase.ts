import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { Platform } from 'react-native';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const authConfigured = Object.values(config).every(Boolean);
let instance: FirebaseAuth.Auth | undefined;

export function getFirebaseAuth(): FirebaseAuth.Auth {
  if (!authConfigured) throw new Error('Account sign-in is not configured in this build. Continue as a guest.');
  if (instance) return instance;
  const app = getApps().length ? getApp() : initializeApp(config);
  if (Platform.OS === 'web') {
    instance = FirebaseAuth.getAuth(app);
  } else {
    const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
      getReactNativePersistence: (storage: typeof AsyncStorage) => FirebaseAuth.Persistence;
    };
    try {
      instance = FirebaseAuth.initializeAuth(app, { persistence: nativeAuth.getReactNativePersistence(AsyncStorage) });
    } catch (error) {
      if ((error as { code?: string }).code !== 'auth/already-initialized') throw error;
      instance = FirebaseAuth.getAuth(app);
    }
  }
  return instance;
}
