

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail, updatePassword } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  projectId: "mehndify",
  appId: "1:453887083411:web:e459c513a80c98f98c8a77",
  storageBucket: "utsavlook.appspot.com",
  apiKey: "YOUR_API_KEY",
  authDomain: "utsavlook.in",
  messagingSenderId: "453887083411",
};


// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// --- Firestore Initialization with Offline Persistence ---
let dbInitializationPromise: Promise<Firestore>;

const initializeDb = async (): Promise<Firestore> => {
    const db = getFirestore(app);

    if (typeof window !== 'undefined') {
        try {
            await enableIndexedDbPersistence(db);
            console.log("Firebase Offline Persistence enabled.");
        } catch (err: any) {
            if (err.code === 'failed-precondition') {
                console.info("Firestore persistence failed-precondition. This can happen with multiple tabs open.");
            } else if (err.code === 'unimplemented') {
                console.warn("Firestore persistence is not supported in this browser.");
            } else {
                 console.error("Error enabling Firestore persistence", err);
            }
        }
    }
    
    return db;
};

// Eagerly initialize the database as soon as this module is loaded.
if (typeof window !== 'undefined') {
    dbInitializationPromise = initializeDb();
}


// Use this function in your services to get the initialized DB instance
export const getDb = async (): Promise<Firestore> => {
    if (!dbInitializationPromise) {
        // This will handle server-side rendering or cases where the eager init hasn't run.
        dbInitializationPromise = initializeDb();
    }
    return dbInitializationPromise;
}
// ---------------------------------------------------------


const signInWithGoogle = (): Promise<User> => {
  return signInWithPopup(auth, googleProvider).then(result => result.user);
};

const setupRecaptcha = (containerId: string): RecaptchaVerifier => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
    }
    const verifier = new RecaptchaVerifier(auth, containerId, {
        'size': 'invisible',
        'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
    });
    return verifier;
}


const sendOtp = (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> => {
    const fullPhoneNumber = `+91${phoneNumber}`; // Assuming Indian phone numbers
    return signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
}

const getFCMToken = async () => {
    const isMessagingSupported = await isSupported();
    if (!isMessagingSupported) {
        console.log("Firebase Messaging is not supported in this browser.");
        return null;
    }
    
    const messaging = getMessaging(app);
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE' });
            return token;
        } else {
            console.log('Unable to get permission to notify.');
            return null;
        }
    } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
        return null;
    }
};

const onForegroundMessage = () => {
    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
        console.log('Foreground message received. ', payload);
        // You can display a custom toast or notification here
    });
}

const createUser = async (email: string, password: string):Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

const signOutUser = () => {
    return signOut(auth);
}


export { app, auth, signInWithGoogle, getFCMToken, onForegroundMessage, setupRecaptcha, sendOtp, createUser, signOutUser, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged, updatePassword };
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}
