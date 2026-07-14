import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase Web configuration is public project/app identification data.
// Admin SDK credentials must remain in firebasekey/ and must never be imported here.
const firebaseConfig = {
  apiKey: 'AIzaSyBra-5L97ZgFXpvg3xDlZrc6IfylNdEzyM',
  authDomain: 'david888-crm.firebaseapp.com',
  projectId: 'david888-crm',
  storageBucket: 'david888-crm.firebasestorage.app',
  messagingSenderId: '891344408607',
  appId: '1:891344408607:web:ec37ecff41c2134f40052a',
  measurementId: 'G-3RHS5E38EJ',
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
