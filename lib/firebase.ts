import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';

// Firebase Web configuration is public project/app identification data.
// Admin SDK credentials must remain in firebasekey/ and must never be imported here.
const firebaseConfig = {
  apiKey: '***REMOVED***',
  authDomain: 'aicreate360-official-web-stg.firebaseapp.com',
  projectId: 'aicreate360-official-web-stg',
  storageBucket: 'aicreate360-official-web-stg.firebasestorage.app',
  messagingSenderId: '365400490786',
  appId: '1:365400490786:web:8cbeaaad4039fa9db1db7b',
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
export const firebaseDb = getFirestore(firebaseApp);
export const firebaseFunctions = getFunctions(firebaseApp, 'asia-east1');
