'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';

interface FirebaseServices {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  db: Firestore; // Add db for alias consistency
}

let firebaseServices: FirebaseServices | null = null;

/**
 * Initializes and returns a singleton instance of Firebase services.
 * This function handles both server-side and client-side initialization,
 * ensuring that Firebase is only initialized once.
 */
export function getFirebaseServices(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  let app: FirebaseApp;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  const auth = getAuth(app);
  // Using initializeFirestore instead of getFirestore to enable persistence
  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });

  firebaseServices = {
    firebaseApp: app,
    auth,
    firestore,
    db: firestore, // Alias db to firestore
  };
  
  return firebaseServices;
}

// Export individual services for direct import if needed
const { firebaseApp: app, auth, db } = getFirebaseServices();
export { app, auth, db };
