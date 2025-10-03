// src/firebase.config.ts
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBkMJSMe85r0Tz0O60uRyxb-GHYAttJ3BM",
  authDomain: "jeu-ferargile.firebaseapp.com",
  projectId: "jeu-ferargile",
  storageBucket: "jeu-ferargile.firebasestorage.app",
  messagingSenderId: "717333118649",
  appId: "1:717333118649:web:dd11d5f87de2fd5ef42568",
  measurementId: "G-GK754H27BV"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
