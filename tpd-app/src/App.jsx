import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Sidebar from './components/common/Sidebar';
import ToastContainer from './components/common/Toast';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Inventory from './pages/Inventory';
import Reports from './pages/Reports';

/* Loading screen shown while AuthContext reads localStorage */
function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-primary)',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</p>
    </div>
  );
}

/* The authenticated shell — AppProvider lives here, NOT per-route */
function AuthenticatedApp() {
  return (
    <AppProvider>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/stock-in" element={<StockIn />} />
            <Route path="/stock-out" element={<StockOut />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <ToastContainer />
      </div>
    </AppProvider>
  );
}

/* Root router — decides between login and authenticated shell */
function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/*"
        element={user ? <AuthenticatedApp /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
