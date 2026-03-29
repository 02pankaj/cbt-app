import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAfmO9OcgoL2oaVNRDq89-gvpFo54HyRq0",
  authDomain: "cbt-platform-3d6e2.firebaseapp.com",
  projectId: "cbt-platform-3d6e2",
  storageBucket: "cbt-platform-3d6e2.firebasestorage.app",
  messagingSenderId: "1043360916468",
  appId: "1:1043360916468:web:1585e8ca610ca4d7034fa1",
  measurementId: "G-77E25F9W8S"
};

// 2. Initialize Firebase (This logic prevents double-loading during development)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// 3. Export these so you can use them in your Login or Exam pages
export const auth = getAuth(app); // For Login
export const db = getFirestore(app); // For Database