
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, Firestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  "projectId": "mehndify",
  "appId": "1:837518627913:web:2935b777173393da1d1b98",
  "storageBucket": "mehndify.firebasestorage.app",
  "apiKey": "AIzaSyCERepylTUMG_oujzlwIa6kwBPZxDV-O4I",
  "authDomain": "mehndify.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "837518627913"
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
  return new Promise((resolve, reject) => {
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        resolve(result.user);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

const signInAsAdmin = (email: string, password: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        signInWithEmailAndPassword(auth, email, password)
            .then(userCredential => {
                resolve(userCredential.user);
            })
            .catch(error => {
                reject(error);
            });
    });
};

const setupRecaptcha = (containerId: string) => {
    if (typeof window !== 'undefined') {
        if (window.recaptchaVerifier) {
            window.recaptchaVerifier.clear();
        }
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
}

const sendOtp = (phoneNumber: string): Promise<ConfirmationResult> => {
    const appVerifier = window.recaptchaVerifier;
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


export { app, auth, signInWithGoogle, getFCMToken, onForegroundMessage, setupRecaptcha, sendOtp, signInAsAdmin };
declare global {
    interface Window {
        recaptchaVerifier: RecaptchaVerifier;
        confirmationResult?: ConfirmationResult;
    }
}
