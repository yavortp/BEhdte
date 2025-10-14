import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDNCoFChIdARlRHNA6cL-JQazGelTZbt0s",
    authDomain: "location-service-web-admin.firebaseapp.com",
    projectId: "location-service-web-admin",
    storageBucket: "location-service-web-admin.firebasestorage.app",
    messagingSenderId: "1027503240934",
    appId: "1:1027503240934:web:e86f5a72ce5bd8ccae2d27",
    measurementId: "G-0SV0XQ970W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);