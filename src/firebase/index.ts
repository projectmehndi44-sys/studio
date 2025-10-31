'use client';

import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { getFirebaseServices } from './init';

// Get singleton instances of Firebase services
const { firebaseApp: app, auth, firestore, db } = getFirebaseServices();

const storage = getStorage(app);
const functions = getFunctions(app);

export const callFirebaseFunction = async (functionName: string, data: any) => {
    const callable = httpsCallable(functions, functionName);
    return callable(data);
};

// Export the initialized services
export { app, auth, firestore, storage, functions };

// Re-export all the necessary hooks and providers
export * from './provider';
export * from './client-provider';
export * from './auth/use-artist-auth';
export * from './auth/use-admin-auth';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
