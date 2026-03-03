// firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// Your web app's Firebase configuration
const firebaseConfig = {
  // Supply this via .env or your CI/CD environment.
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: "test-5675d.firebaseapp.com",
  projectId: "test-5675d",
  storageBucket: "test-5675d.firebasestorage.app",
  messagingSenderId: "35505586824",
  appId: "1:35505586824:web:724bc1183efca476f5153d",
  measurementId: "G-0ETQ5YCT1N",
  // IMPORTANT: Add your Realtime Database URL from Firebase Console
  databaseURL: "https://test-5675d-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (existing)
export const db = getFirestore(app);

// Initialize Realtime Database
export const database = getDatabase(app);

export { app };
