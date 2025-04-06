import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// This module is designed to be used by both the React app and the Chrome extension
// It dynamically determines the appropriate Firebase config based on the environment

// Define a Chrome runtime interface for TypeScript
// We use a different name to avoid conflicts with chrome.d.ts
interface ChromeExtensionRuntime {
  runtime?: {
    id?: string;
  };
}

// Get Firebase config from environment variables or extension settings
function getFirebaseConfig() {
  // Check if running in a Chrome extension environment
  // Using typeof checks for browser compatibility
  const isExtension = typeof window !== 'undefined' && 
                     typeof (window as any).chrome !== 'undefined' && 
                     (window as any).chrome.runtime && 
                     (window as any).chrome.runtime.id;
  
  if (isExtension) {
    // In extension environment, use hardcoded config that matches the extension's manifest
    // This should be the same as what's in background.js
    return {
      apiKey: "AIzaSyAEJrsFagxQs8KmaG47fKKzcC_81LAJ4R8",
      authDomain: "jobs-streak.firebaseapp.com",
      projectId: "jobs-streak",
      storageBucket: "jobs-streak.firebasestorage.app",
      messagingSenderId: "848377435066",
      appId: "1:848377435066:web:a809f63b3b1a99c9768383",
      measurementId: "G-87ZXGEFB07"
    };
  } else {
    // In standard web app environment, use environment variables
    return {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };
  }
}

// Initialize Firebase with appropriate config
const app = initializeApp(getFirebaseConfig());
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance for other Firebase services
export default app;