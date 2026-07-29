import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import en from '@/locales/en';
import ar from '@/locales/ar';
import fr from '@/locales/fr';
import de from '@/locales/de';
import hi from '@/locales/hi';
import fa from '@/locales/fa';
import ur from '@/locales/ur';

// Supported app languages. dir drives document direction (rtl/ltr).
export const LANGUAGES = [
  { id: 'en', name: 'English', dir: 'ltr' },
  { id: 'fr', name: 'Français', dir: 'ltr' },
  { id: 'ar', name: 'العربية', dir: 'rtl' },
  { id: 'de', name: 'Deutsch', dir: 'ltr' },
  { id: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { id: 'fa', name: 'فارسی', dir: 'rtl' },
  { id: 'ur', name: 'اردو', dir: 'rtl' }
];

const DICTS = { en, ar, fr, de, hi, fa, ur };

// Detect the browser/UI language on first run when nothing is saved.
const detectLang = () => {
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
    if (DICTS[nav]) return nav;
  }
  return 'en';
};

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('mangaocr_lang') || detectLang());

  useEffect(() => {
    const meta = LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;
  }, [lang]);

  const setLang = useCallback((l) => {
    localStorage.setItem('mangaocr_lang', l);
    setLangState(l);
  }, []);

  // t(key) — falls back to the English string, then the raw key if missing.
  const t = useCallback((key) => {
    const dict = DICTS[lang] || en;
    return dict[key] ?? en[key] ?? key;
  }, [lang]);

  const dir = (LANGUAGES.find((l) => l.id === lang) || LANGUAGES[0]).dir;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => useContext(I18nContext);