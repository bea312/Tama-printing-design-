import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, TrendingUp, TrendingDown,
  Warehouse, BarChart3, LogOut, ChevronLeft, ChevronRight,
  AlertTriangle, Printer, Trash2, Wallet, Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { clearAllData } from '../../services/storage';

const NAV_ADMIN = [
  { to: '/', icon: LayoutDashboard, key: 'dashboard' },
  { to: '/products', icon: Package, key: 'products' },
  { to: '/stock-in', icon: TrendingUp, key: 'stockIn' },
  { to: '/stock-out', icon: TrendingDown, key: 'stockOut' },
  { to: '/inventory', icon: Warehouse, key: 'inventory' },
  { to: '/expenses', icon: Wallet, key: 'expenses' },
  { to: '/team', icon: Users, key: 'team' },
  { to: '/reports', icon: BarChart3, key: 'reports' },
];

const NAV_EMPLOYEE = [
  { to: '/stock-out', icon: TrendingDown, key: 'stockOut' },
  { to: '/expenses', icon: Wallet, key: 'expenses' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { lowStockProducts, sidebarOpen, setSidebarOpen, mobileNavOpen, setMobileNavOpen, refresh } = useApp();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const isAdmin = user?.role !== 'employee';
  const NAV = isAdmin ? NAV_ADMIN : NAV_EMPLOYEE;

  const handleClearData = () => {
    clearAllData();
    refresh();
    setConfirmClear(false);
    navigate('/');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileNav = () => setMobileNavOpen(false);

  return (
    <>
      {mobileNavOpen && <div className="sidebar-backdrop" onClick={closeMobileNav} />}
      <aside
        className={`sidebar${mobileNavOpen ? ' mobile-open' : ''}`}
        style={{
          width: sidebarOpen ? '260px' : '70px',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease, transform 0.3s ease',
          zIndex: 300,
          overflow: 'hidden',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minHeight: 'var(--header-height)',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(37,99,235,0.4)',
          }}>
            <Printer size={20} color="white" />
          </div>
          {sidebarOpen && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 800,
                fontSize: '1rem',
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                whiteSpace: 'nowrap',
              }}>
                Tama Printing
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--brand-blue-light)', fontWeight: 600, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
                DESIGN — TPD
              </div>
            </div>
          )}
        </div>

        {/* Toggle button (desktop collapse) */}
        <button
          className="sidebar-collapse-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'absolute',
            top: '20px',
            right: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'var(--transition)',
          }}
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', overflowY: 'auto' }}>
          {sidebarOpen && (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '8px 12px 4px', textTransform: 'uppercase' }}>
              {t('nav.navigation')}
            </div>
          )}
          {NAV.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={closeMobileNav}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '4px',
                textDecoration: 'none',
                transition: 'var(--transition)',
                background: isActive ? 'rgba(37,99,235,0.15)' : 'transparent',
                color: isActive ? 'var(--brand-blue-light)' : 'var(--text-secondary)',
                borderLeft: isActive ? '3px solid var(--brand-blue)' : '3px solid transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              })}
            >
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span>{t(`nav.${key}`)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Low stock alert */}
        {isAdmin && sidebarOpen && lowStockProducts.length > 0 && (
          <div style={{
            margin: '0 8px 8px',
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red-light)', fontSize: '0.78rem', fontWeight: 600 }}>
              <AlertTriangle size={14} />
              {lowStockProducts.length} {t('dashboard.lowStockAlerts')}
            </div>
          </div>
        )}

        {/* User / Logout */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border-color)' }}>
          {sidebarOpen && (
            <div style={{ padding: '8px 12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{user?.role}</div>
            </div>
          )}

          {/* Clear all data — admin only */}
          {isAdmin && (!confirmClear ? (
            <button
              onClick={() => setConfirmClear(true)}
              title={t('common.clearAllData')}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 12px', borderRadius: 'var(--radius-md)',
                background: 'transparent', border: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 500, width: '100%',
                transition: 'var(--transition)', whiteSpace: 'nowrap', marginBottom: '4px',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--accent-red-light)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <Trash2 size={14} style={{ flexShrink: 0 }} />
              {sidebarOpen && t('common.clearAllData')}
            </button>
          ) : (
            sidebarOpen && (
              <div style={{ padding: '8px 12px', marginBottom: '4px', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-red-light)', marginBottom: '8px', fontWeight: 600 }}>{t('common.deleteAllData')}</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={handleClearData} style={{ flex: 1, padding: '5px', background: 'var(--accent-red)', border: 'none', borderRadius: 'var(--radius-sm)', color: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>{t('common.clear')}</button>
                  <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: '5px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)', fontSize: '0.75rem', cursor: 'pointer' }}>{t('common.cancel')}</button>
                </div>
              </div>
            )
          ))}

          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              background: 'transparent', border: 'none',
              color: 'var(--accent-red-light)', cursor: 'pointer',
              fontSize: '0.875rem', fontWeight: 600, width: '100%',
              transition: 'var(--transition)', whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <LogOut size={16} style={{ flexShrink: 0 }} />
            {sidebarOpen && t('common.signOut')}
          </button>
        </div>
      </aside>
    </>
  );
}
