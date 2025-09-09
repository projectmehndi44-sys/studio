
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
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db)
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one.
                // This is a normal scenario.
            } else if (err.code == 'unimplemented') {
                // The current browser does not support all of the
                // features required to enable persistence
            }
        });
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
