import { createContext, useContext, useState } from 'react';
import { getAuth, saveAuth, clearAuth, getUsers, saveUsers, setActiveAccount } from '../services/storage';

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
   directly in the lazy useState initializer — no effect/loading gap needed. */
const loadStoredUser = () => {
  const stored = getAuth();
  if (stored) setActiveAccount(stored.email);
  return stored;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const loading = false;

  const login = (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_RE.test(normalizedEmail)) {
      return { success: false, error: 'invalidEmail' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'weakPassword' };
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
    const auth = {
      email: normalizedEmail,
      name: existing ? existing.name : nameFromEmail(normalizedEmail),
      role: 'admin',
      loginAt: new Date().toISOString(),
    };
    saveAuth(auth);
    setUser(auth);
    return { success: true, isNewAccount };
  };

  const logout = () => {
    clearAuth();
    setActiveAccount(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its Provider by design, consistent across every context in this app
export const useAuth = () => useContext(AuthContext);
