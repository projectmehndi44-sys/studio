
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  "projectId": "studio-163529036-f9a8c",
  "appId": "1:240526745218:web:bf45387565e48cb9cf9e9b",
  "storageBucket": "studio-163529036-f9a8c.appspot.com",
  "apiKey": "AIzaSyD8DvhHJ3nzHmBXRFNDVzxgWcb7Nx5qkrY",
  "authDomain": "studio-163529036-f9a8c.firebaseapp.com",
  "messagingSenderId": "240526745218"
};


// --- Singleton Pattern for Firebase App Initialization ---
export const getFirebaseApp = (): FirebaseApp => {
    if (getApps().length === 0) {
        return initializeApp(firebaseConfig);
    } else {
        return getApp();
    }
}

const app = getFirebaseApp();
const auth = getAuth(app);


// Initialize Firestore with offline persistence enabled.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

const functions = getFunctions(getFirebaseApp());

export const callFirebaseFunction = async (functionName: string, data: any) => {
    const callable = httpsCallable(functions, functionName);
    return callable(data);
};


export { app, auth, db, getStorage };
