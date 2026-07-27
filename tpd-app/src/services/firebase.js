import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/* Cloud sync only turns on once real project keys are supplied via .env.local.
   Always off under Vitest so the test suite keeps exercising the local-only
   fallback path deterministically, with no network involved. */
export const firebaseEnabled = !import.meta.env.VITEST && Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = firebaseEnabled ? (getApps().length ? getApps()[0] : initializeApp(firebaseConfig)) : null;

export const auth = firebaseEnabled ? getAuth(app) : null;
export const db = firebaseEnabled ? getFirestore(app) : null;

/* Resolves once Firebase Auth has rehydrated any session persisted from a previous
   visit (or immediately with null when cloud sync is off). Firestore reads that rely
   on request.auth must wait on this so they don't race the SDK's own session restore
   right after a page reload. */
export const authReady = firebaseEnabled
  ? new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => { unsubscribe(); resolve(user); });
    })
  : Promise.resolve(null);
