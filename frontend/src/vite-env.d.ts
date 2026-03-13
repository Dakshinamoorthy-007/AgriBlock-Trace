/// <reference types="vite/client" />
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyDCNgKliki6gBcM8tih4LAj21xdWQWO9HI",
  authDomain: "agrichain-fd6eb.firebaseapp.com",
  projectId: "agrichain-fd6eb",
  storageBucket: "agrichain-fd6eb.firebasestorage.app",
  messagingSenderId: "878101328972",
  appId: "1:878101328972:web:2089a25e017b06ca98b0e9",
  measurementId: "G-H2CNHRB2CE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);