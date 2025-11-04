// firebase-config.js

// PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
// You get this from your Firebase project settings under "General".
const firebaseConfig = {
  apiKey: "AIzaSyDeycgVCvj1WOJ5xMcP4qhkC3T9fZPozF4",
  authDomain: "sakoar-b2e64.firebaseapp.com",
  projectId: "sakoar-b2e64",
  storageBucket: "sakoar-b2e64.firebasestorage.app",
  messagingSenderId: "667532880996",
  appId: "1:667532880996:web:cfba36a9ad361248e90371",
  measurementId: "G-T6F1FRCKQJ"
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
