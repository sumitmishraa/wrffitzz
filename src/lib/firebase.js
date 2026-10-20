import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBByKE7fyta6PJ2hVNHPavUl2Nl_CY3ILY",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "wrfitzz.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "wrfitzz",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "wrfitzz.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "972075457589",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:972075457589:web:f89415217e4cefa391a57c",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-X4JH2CHV5J",
};

// Singleton initialization safe for Next.js SSR and client hydrations
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = typeof window !== 'undefined' ? getAuth(app) : null;
