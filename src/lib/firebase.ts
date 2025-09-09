
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, User } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mehndify",
  appId: "1:837518627913:web:2935b777173393da1d1b98",
  storageBucket: "mehndify.firebasestorage.app",
  apiKey: "AIzaSyCERepylTUMG_oujzlwIa6kwBPZxDV-O4I",
  authDomain: "mehndify.firebaseapp.com",
  measurementId: "",
  messagingSenderId: "837518627913"
};


// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
if (typeof window !== 'undefined') {
    try {
        enableIndexedDbPersistence(db)
            .catch((err) => {
                if (err.code == 'failed-precondition') {
                    // Multiple tabs open, persistence can only be enabled in one.
                    // This is a normal scenario.
                    console.info("Firestore persistence failed-precondition. Multiple tabs open?");
                } else if (err.code == 'unimplemented') {
                    // The current browser does not support all of the
                    // features required to enable persistence
                    console.warn("Firestore persistence is not supported in this browser.");
                }
            });
    } catch (error) {
        console.error("Error enabling Firestore persistence", error);
    }
}


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


export { app, auth, db, signInWithGoogle };
