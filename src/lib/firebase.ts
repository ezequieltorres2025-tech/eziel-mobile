import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    getApp,
    getApps,
    initializeApp,
    type FirebaseOptions,
} from "firebase/app";
import {
    getReactNativePersistence,
    initializeAuth,
    type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function requireEnv(name: string, value: string | undefined): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(`Missing required Firebase environment variable: ${name}`);
  }

  return normalizedValue;
}

const firebaseConfig: FirebaseOptions = {
  apiKey: requireEnv(
    "EXPO_PUBLIC_FIREBASE_API_KEY",
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  ),

  authDomain: requireEnv(
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ),

  projectId: requireEnv(
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  ),

  storageBucket: requireEnv(
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  ),

  messagingSenderId: requireEnv(
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  ),

  appId: requireEnv(
    "EXPO_PUBLIC_FIREBASE_APP_ID",
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  ),

  measurementId:
    process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID?.trim() || undefined,
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

type FirebaseRuntime = typeof globalThis & {
  __EZIEL_FIREBASE_AUTH__?: Auth;
};

const firebaseRuntime = globalThis as FirebaseRuntime;

function initializeMobileAuth(): Auth {
  if (firebaseRuntime.__EZIEL_FIREBASE_AUTH__) {
    return firebaseRuntime.__EZIEL_FIREBASE_AUTH__;
  }

  const auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  firebaseRuntime.__EZIEL_FIREBASE_AUTH__ = auth;

  return auth;
}

export const auth = initializeMobileAuth();

export const db = getFirestore(firebaseApp);

export const storage = getStorage(firebaseApp);

export const firebaseProjectId = firebaseConfig.projectId;

export default firebaseApp;
