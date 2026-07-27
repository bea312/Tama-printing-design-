import { createContext, useContext, useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, firebaseEnabled } from '../services/firebase';
import { getAuth, saveAuth, clearAuth, getUsers, saveUsers, getEmployees, setActiveAccount } from '../services/storage';

const AuthContext = createContext(null);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const nameFromEmail = (email) =>
  email
    .split('@')[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/* Reading the saved session is synchronous (localStorage), so it can run
   directly in the lazy useState initializer — no effect/loading gap needed.
   Employees share their owner admin's data namespace, not their own email. */
const loadStoredUser = () => {
  const stored = getAuth();
  if (stored) setActiveAccount(stored.role === 'employee' ? stored.ownerEmail : stored.email);
  return stored;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const loading = false;

  /* Local-only mode (no Firebase project configured): everything lives in this
     browser's localStorage, exactly as before — same email on another device/browser
     starts out empty since there is nowhere shared to read it from. */
  const loginLocal = (normalizedEmail, password) => {
    const employee = getEmployees().find((e) => e.email === normalizedEmail);
    if (employee) {
      if (employee.password !== password) {
        return { success: false, error: 'wrongPassword' };
      }
      setActiveAccount(employee.ownerEmail);
      const auth = {
        email: normalizedEmail,
        name: employee.name,
        role: 'employee',
        ownerEmail: employee.ownerEmail,
        loginAt: new Date().toISOString(),
      };
      saveAuth(auth);
      setUser(auth);
      return { success: true, isNewAccount: false };
    }

    const users = getUsers();
    const existing = users.find((u) => u.email === normalizedEmail);
    let isNewAccount = false;

    if (existing) {
      if (existing.password !== password) {
        return { success: false, error: 'wrongPassword' };
      }
    } else {
      isNewAccount = true;
      const newUser = {
        email: normalizedEmail,
        password,
        name: nameFromEmail(normalizedEmail),
        role: 'admin',
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, newUser]);
    }

    setActiveAccount(normalizedEmail);
    const authRecord = {
      email: normalizedEmail,
      name: existing ? existing.name : nameFromEmail(normalizedEmail),
      role: 'admin',
      loginAt: new Date().toISOString(),
    };
    saveAuth(authRecord);
    setUser(authRecord);
    return { success: true, isNewAccount };
  };

  /* Cloud mode: Firebase Authentication is the source of truth for credentials, so the
     same email/password works from any device. Admins and employees share one sign-in
     call — we try to create the account first (works for a brand-new admin) and fall
     back to signing in when the email is already registered (existing admin, or an
     employee whose account was pre-created by their owner via the Team page). Which
     role/data-namespace applies is then read from the `employees` Firestore doc. */
  const loginCloud = async (normalizedEmail, password) => {
    let isNewAccount = false;
    try {
      await createUserWithEmailAndPassword(auth, normalizedEmail, password);
      isNewAccount = true;
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, normalizedEmail, password);
        } catch {
          return { success: false, error: 'wrongPassword' };
        }
      } else if (err.code === 'auth/weak-password') {
        return { success: false, error: 'weakPassword' };
      } else {
        return { success: false, error: 'invalidEmail' };
      }
    }

    const employeeSnap = await getDoc(doc(db, 'employees', normalizedEmail));
    let authRecord;
    if (employeeSnap.exists()) {
      const data = employeeSnap.data();
      authRecord = { email: normalizedEmail, name: data.name, role: 'employee', ownerEmail: data.ownerEmail, loginAt: new Date().toISOString() };
      setActiveAccount(data.ownerEmail);
    } else {
      authRecord = { email: normalizedEmail, name: nameFromEmail(normalizedEmail), role: 'admin', loginAt: new Date().toISOString() };
      setActiveAccount(normalizedEmail);
    }
    saveAuth(authRecord);
    setUser(authRecord);
    return { success: true, isNewAccount };
  };

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_RE.test(normalizedEmail)) {
      return { success: false, error: 'invalidEmail' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'weakPassword' };
    }

    return firebaseEnabled ? loginCloud(normalizedEmail, password) : loginLocal(normalizedEmail, password);
  };

  const logout = () => {
    clearAuth();
    setActiveAccount(null);
    setUser(null);
    if (firebaseEnabled) firebaseSignOut(auth).catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its Provider by design, consistent across every context in this app
export const useAuth = () => useContext(AuthContext);
