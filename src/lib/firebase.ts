
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signOut, isSignInWithEmailLink as isFbSignInWithEmailLink, signInWithEmailLink as fbSignInWithEmailLink } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getFunctions, httpsCallable, FunctionsError } from "firebase/functions";
import { getStorage } from "firebase/storage";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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


// Dynamically set authDomain for Vercel and custom domains
if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname === 'utsavlook.in') {
        auth.settings.authDomain = hostname;
    }
}


// Initialize Firestore with offline persistence enabled.
// This is the SINGLE source of truth for the Firestore instance.
const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});


const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    const fullPhoneNumber = `+91${phoneNumber}`;
    return signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
}

const signOutUser = () => {
    return signOut(auth);
}

const isSignInWithEmailLink = (auth: any, link: any) => isFbSignInWithEmailLink(auth, link);
const signInWithEmailLink = (auth: any, email: any, link: any) => fbSignInWithEmailLink(auth, email, link);

// --- Firebase Functions ---
const functions = getFunctions(getFirebaseApp());
export const callFirebaseFunction = async (functionName: string, data: any) => {
    const callable = httpsCallable(functions, functionName);
    
    try {
        const result = await callable(data);
        return result;
    } catch (error: any) {
        // Check if it's a permission-denied error from the function
        if (error.code === 'permission-denied' || error.code === 'unauthenticated' || error.code === 'failed-precondition' || error.code === 'invalid-argument') {
             const permissionError = new FirestorePermissionError({
                path: `Cloud Function: ${functionName}`,
                operation: 'write', // Functions that modify data are 'write' operations
                requestResourceData: data,
            } satisfies SecurityRuleContext);
            errorEmitter.emit('permission-error', permissionError);
        }
        // Instead of re-throwing, return an object indicating failure
        // This allows the caller to handle UI without crashing on an unhandled promise rejection
        return { data: { success: false, message: error.message } };
    }
};


export { app, auth, db, sendOtp, signOutUser, getStorage, isSignInWithEmailLink, signInWithEmailLink };

// This is required for the window.confirmationResult to be accessible
declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
        grecaptcha?: any;
    }
}

