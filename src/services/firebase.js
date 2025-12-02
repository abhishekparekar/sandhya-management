// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDhXwUY9GWDUihdyLDRGmDUuclMsMuRSBs",
    authDomain: "sandhya-mang.firebaseapp.com",
    projectId: "sandhya-mang",
    storageBucket: "sandhya-mang.firebasestorage.app",
    messagingSenderId: "177779159902",
    appId: "1:177779159902:web:96d5563b603d2346f295cf",
    measurementId: "G-HP178LJ1RP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;