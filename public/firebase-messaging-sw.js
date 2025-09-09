
// This file must be in the public directory

// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Your web app's Firebase configuration
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
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
