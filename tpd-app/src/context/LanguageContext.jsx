import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translations, LANGUAGES } from '../i18n/translations';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'tpd_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const t = useCallback((path) => {
    const parts = path.split('.');
    const lookup = (dict) => parts.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
    return lookup(translations[lang]) ?? lookup(translations.en) ?? path;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook lives alongside its Provider by design, consistent across every context in this app
export const useLanguage = () => useContext(LanguageContext);
