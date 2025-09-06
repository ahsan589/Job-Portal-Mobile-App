// src/config/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAuI0yO4zSmRxElZxvFqLLpU6e3npC5Bho",
  authDomain: "jobportal-8686b.firebaseapp.com",
  databaseURL: "https://jobportal-8686b-default-rtdb.firebaseio.com",
  projectId: "jobportal-8686b",
  storageBucket: "jobportal-8686b.firebasestorage.app",
  messagingSenderId: "213721520714",
  appId: "1:213721520714:web:18f2c5a2b7285f61dae4b3",
  measurementId: "G-N31HPGG704"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const realtimeDb = getDatabase(app);
const storage = getStorage(app);

export { auth, db, realtimeDb, storage };

