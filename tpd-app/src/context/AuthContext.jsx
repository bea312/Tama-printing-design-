import { createContext, useContext, useState, useEffect } from 'react';
import { getAuth, saveAuth, clearAuth } from '../services/storage';

const AuthContext = createContext(null);

const ADMIN_CREDENTIALS = { username: 'admin', password: 'tpd2024' };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getAuth();
    if (stored) setUser(stored);
    setLoading(false);
  }, []);

  const login = (username, password) => {
    if (
      username.trim().toLowerCase() === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const auth = { username: 'admin', name: 'Administrator', role: 'admin', loginAt: new Date().toISOString() };
      saveAuth(auth);
      setUser(auth);
      return { success: true };
    }
    return { success: false, error: 'Invalid username or password' };
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
