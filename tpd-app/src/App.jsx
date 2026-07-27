import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Sidebar from './components/common/Sidebar';
import ToastContainer from './components/common/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import StockIn from './pages/StockIn';
import StockOut from './pages/StockOut';
import Inventory from './pages/Inventory';
import Expenses from './pages/Expenses';
import Team from './pages/Team';
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

/* Layout shell — reads sidebarOpen so main-content margin stays in sync
   with the sidebar's actual (expanded/collapsed) width.
   Employees only get Stock Out + Expenses; everything else redirects there. */
function AppShell() {
  const { sidebarOpen } = useApp();
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  return (
    <div className="app-layout">
      <Sidebar />
      <main className={`main-content${sidebarOpen ? '' : ' sidebar-collapsed'}`}>
        <Routes>
          {isEmployee ? (
            <>
              <Route path="/stock-out" element={<StockOut />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="*" element={<Navigate to="/stock-out" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/stock-in" element={<StockIn />} />
              <Route path="/stock-out" element={<StockOut />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/team" element={<Team />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          )}
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
}

/* The authenticated shell — AppProvider lives here, NOT per-route */
function AuthenticatedApp() {
  return (
    <AppProvider>
      <AppShell />
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
        path="/"
        element={user ? <AuthenticatedApp /> : <Landing />}
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
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </ErrorBoundary>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  );
}
