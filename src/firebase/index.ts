
'use client';

import { getStorage } from "firebase/storage";
import { getFirebaseServices } from './init';

// Get singleton instances of Firebase services
const { firebaseApp: app, auth, firestore, db } = getFirebaseServices();

const storage = getStorage(app);

// Export the initialized services
export { app, auth, firestore, storage, db };

// Re-export all the necessary hooks and providers
export * from './provider';
export * from './client-provider';
export * from './auth/use-artist-auth';
export * from './auth/use-admin-auth';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './functions';
