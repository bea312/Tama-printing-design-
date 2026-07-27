import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Eye, EyeOff, Printer, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import ThemeLangSwitcher from '../components/common/ThemeLangSwitcher';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setError(t(`login.errors.${result.error}`));
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 2 }}>
        <ThemeLangSwitcher compact />
      </div>
      <Link
        to="/"
        style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 2,
          display: 'flex', alignItems: 'center', gap: '6px',
          height: '36px', padding: '0 14px', borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)', border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500,
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} /> {t('login.backToHome')}
      </Link>
      {/* Background decorations */}
      <div style={{ position: 'absolute', top: '-150px', left: '-150px', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(37,99,235,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(16,185,129,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Logo card */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 0 40px rgba(37,99,235,0.4)',
          }}>
            <Printer size={34} color="white" />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Poppins, sans-serif', color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Tama Printing Design
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('login.tagline')}</p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
        }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '24px', color: 'var(--text-primary)' }}>{t('login.welcome')}</h2>

          {error && (
            <div className="alert alert-danger">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">{t('login.email')}</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('login.password')}</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: '38px', paddingRight: '42px' }}
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                  {t('login.signingIn')}
                </>
              ) : t('login.signIn')}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          © 2026 {t('login.footer')}
        </p>
      </div>
    </div>
  );
}
