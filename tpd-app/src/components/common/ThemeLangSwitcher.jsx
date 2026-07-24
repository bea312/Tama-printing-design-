import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

export default function ThemeLangSwitcher({ compact = false }) {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, languages, t } = useLanguage();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select
        className="form-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
        style={{
          height: compact ? '36px' : '40px',
          width: compact ? 'auto' : undefined,
          padding: '0 10px',
          fontSize: '0.8rem',
        }}
      >
        {languages.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
      </select>

      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        aria-label="Toggle theme"
        style={{
          width: compact ? '36px' : '40px',
          height: compact ? '36px' : '40px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
