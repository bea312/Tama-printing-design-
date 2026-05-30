import { Bell, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, subtitle }) {
  const { lowStockProducts } = useApp();
  const { user } = useAuth();

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(8px)',
    }}>
      <div>
        <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Alert bell */}
        <div style={{ position: 'relative' }}>
          <button style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <Bell size={16} />
          </button>
          {lowStockProducts.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--accent-red)',
              color: 'white',
              fontSize: '0.6rem',
              fontWeight: 700,
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid var(--bg-secondary)',
            }}>
              {lowStockProducts.length}
            </span>
          )}
        </div>

        {/* Avatar */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--brand-blue), var(--brand-blue-dark))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.85rem',
          cursor: 'pointer',
          border: '2px solid rgba(37,99,235,0.4)',
        }}>
          {(user?.name || 'A').charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
