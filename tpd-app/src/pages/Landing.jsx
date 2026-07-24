import { Link } from 'react-router-dom';
import {
  Printer, Package, ArrowDownCircle, ArrowUpCircle, Boxes, BarChart3,
  ShieldCheck, MapPin, Mail, Phone, ArrowRight, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import ThemeLangSwitcher from '../components/common/ThemeLangSwitcher';

const FEATURES = [
  { icon: Package, color: 'blue', n: 1 },
  { icon: ArrowDownCircle, color: 'green', n: 2 },
  { icon: ArrowUpCircle, color: 'gold', n: 3 },
  { icon: Boxes, color: 'purple', n: 4 },
  { icon: BarChart3, color: 'cyan', n: 5 },
  { icon: ShieldCheck, color: 'red', n: 6 },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Nav */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--header-glass)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div style={{
          maxWidth: '1180px', margin: '0 auto', padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px', height: '38px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Printer size={20} color="white" />
            </div>
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
              Tama Printing Design
            </span>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: '20px' }} className="landing-nav-links">
            <a href="#features" className="landing-nav-link">{t('landing.features')}</a>
            <a href="#about" className="landing-nav-link">{t('landing.about')}</a>
            <a href="#contact" className="landing-nav-link">{t('landing.contact')}</a>
            <ThemeLangSwitcher compact />
            <Link to="/login" className="btn btn-primary">{t('landing.login')}</Link>
          </nav>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="landing-menu-toggle"
            style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {menuOpen && (
          <div className="landing-mobile-menu" style={{
            display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 24px 16px',
            borderTop: '1px solid var(--border-color)',
          }}>
            <a href="#features" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.features')}</a>
            <a href="#about" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.about')}</a>
            <a href="#contact" className="landing-nav-link" onClick={() => setMenuOpen(false)}>{t('landing.contact')}</a>
            <ThemeLangSwitcher />
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '8px', justifyContent: 'center' }}>{t('landing.login')}</Link>
          </div>
        )}
      </header>

      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden', textAlign: 'center',
        padding: '110px 24px 90px', maxWidth: '840px', margin: '0 auto',
      }}>
        <div style={{ position: 'absolute', top: '-120px', left: '50%', transform: 'translateX(-50%)', width: '520px', height: '400px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', filter: 'blur(90px)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <span className="badge badge-blue" style={{ marginBottom: '20px' }}>{t('login.tagline')}</span>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, margin: '18px 0 16px',
            fontFamily: 'Poppins, sans-serif', color: 'var(--text-primary)', lineHeight: 1.15,
          }}>
            {t('landing.heroTitle')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '560px', margin: '0 auto 32px' }}>
            {t('landing.heroSubtitle')}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              {t('landing.getStarted')} <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn btn-ghost btn-lg">{t('landing.seeFeatures')}</a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '80px 24px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '10px' }}>{t('landing.everythingTitle')}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{t('landing.everythingSubtitle')}</p>
        </div>
        <div className="grid-3 landing-features-grid">
          {FEATURES.map(({ icon: Icon, color, n }) => (
            <div key={n} className="card">
              <div className={`stat-icon ${color}`}>
                <Icon size={22} />
              </div>
              <h3 style={{ fontSize: '1rem', margin: '4px 0 8px' }}>{t(`landing.feature${n}Title`)}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{t(`landing.feature${n}Desc`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" style={{ padding: '70px 24px', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '16px' }}>{t('landing.whoWeAre')}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {t('landing.whoWeAreText')}
          </p>
        </div>
      </section>

      {/* Contact / Footer */}
      <footer id="contact" style={{ padding: '60px 24px 32px', maxWidth: '1180px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '32px', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Printer size={20} color="var(--brand-blue-light)" />
              <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>Tama Printing Design</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {t('landing.footerTagline')}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} color="var(--text-muted)" /> Gisenyi, Rubavu
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={16} color="var(--text-muted)" /> tamaprinting00@gmail.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={16} color="var(--text-muted)" /> 0798704035
            </div>
          </div>
        </div>
        <div className="divider" />
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.78rem', paddingTop: '20px' }}>
          © 2026 Tama Printing Design {t('landing.rights')}
        </p>
      </footer>
    </div>
  );
}
