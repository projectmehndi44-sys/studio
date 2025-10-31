
'use client';

import { getFirebaseApp, auth, db } from '@/lib/firebase';
import { type Auth } from 'firebase/auth';
import { type Firestore } from 'firebase/firestore';
import * as React from 'react';

// Define the shape of the context data
interface FirebaseContextValue {
  app: ReturnType<typeof getFirebaseApp>;
  auth: Auth;
  firestore: Firestore;
}

// Create the context
const FirebaseContext = React.createContext<FirebaseContextValue | null>(null);

// Define the props for the provider component
interface FirebaseProviderProps {
  children: React.ReactNode;
}

// Create the provider component
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  // The instances are now imported from the central module
  const value = { app: getFirebaseApp(), auth: auth, firestore: db };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

// Create custom hooks to access the Firebase instances
export const useFirebase = () => {
  const context = React.useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
