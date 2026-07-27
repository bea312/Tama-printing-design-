import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { firebaseConfig } from './firebase';

/* Creating an employee's Firebase Auth account with the normal client SDK would sign
   the currently-authenticated admin OUT and sign the new employee IN instead (Firebase
   Auth only tracks one active user per app instance). Spinning up a throwaway secondary
   app instance lets us create the account without touching the admin's active session. */
export const createEmployeeAuthAccount = async (email, password) => {
  const secondaryApp = initializeApp(firebaseConfig, `employee-create-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    await createUserWithEmailAndPassword(secondaryAuth, email, password);
  } finally {
    await signOut(secondaryAuth).catch(() => {});
    await deleteApp(secondaryApp).catch(() => {});
  }
};
