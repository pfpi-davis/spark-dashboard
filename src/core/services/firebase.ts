// src/core/services/firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, type Firestore } from 'firebase/firestore';

// TODO: Replace with your keys from Project Settings > General > Your Apps
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT,
  storageBucket: import.meta.env.VITE_FIREBASE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db: Firestore = getFirestore(app);

// A generic helper to keep our plugins clean
export const sparkService = {
  async getAllResources() {
    const col = collection(db, 'resources');
    const snapshot = await getDocs(col);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async addResource(resource: any) {
    const col = collection(db, 'resources');
    // Sanitize dates or undefined values here if needed
    return await addDoc(col, resource);
  }
};