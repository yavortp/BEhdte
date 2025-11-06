import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('All env:', import.meta.env);

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDNCoFChIdARlRHNA6cL-JQazGelTZbt0s",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "location-service-web-admin.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "location-service-web-admin",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "location-service-web-admin.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1027503240934",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1027503240934:web:e86f5a72ce5bd8ccae2d27",
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0SV0XQ970W"
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);