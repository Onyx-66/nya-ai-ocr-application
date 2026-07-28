import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'midnight', name: 'Midnight', swatch: 'hsl(243 75% 61%)' },
  { id: 'ocean', name: 'Ocean', swatch: 'hsl(199 89% 48%)' },
  { id: 'emerald', name: 'Emerald', swatch: 'hsl(160 84% 39%)' },
  { id: 'rose', name: 'Rose', swatch: 'hsl(330 81% 60%)' },
  { id: 'amber', name: 'Amber', swatch: 'hsl(38 92% 50%)' },
  { id: 'violet', name: 'Violet', swatch: 'hsl(265 89% 64%)' },
  { id: 'crimson', name: 'Crimson', swatch: 'hsl(0 84% 50%)' },
  { id: 'teal', name: 'Teal', swatch: 'hsl(188 86% 42%)' },
  { id: 'graphite', name: 'Graphite', swatch: 'hsl(215 25% 60%)' },
  { id: 'light', name: 'Light', swatch: 'hsl(243 75% 59%)' }
];

export const FONTS = [
  { id: 'system', label: 'System', stack: 'ui-sans-serif, system-ui, sans-serif' },
  { id: 'inter', label: 'Inter', stack: "'Inter', sans-serif" },
  { id: 'poppins', label: 'Poppins', stack: "'Poppins', sans-serif" },
  { id: 'roboto', label: 'Roboto', stack: "'Roboto', sans-serif" },
  { id: 'merriweather', label: 'Merriweather', stack: "'Merriweather', serif" },
  { id: 'mono', label: 'Mono', stack: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
];

const ThemeContext = createContext(null);

// Detect the system color scheme when no manual choice is saved:
// dark → Midnight (dark navy/violet), light → Light. A manual choice always wins.
const systemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'midnight' : 'light';
  }
  return 'midnight';
};

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('mangaocr_theme') || systemTheme());
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('mangaocr_font') || 'system');
  const [fontScale, setFontScale] = useState(() => Number(localStorage.getItem('mangaocr_scale') || 1));

  // Apply theme to <html>. We persist only on explicit user choice (setTheme),
  // so a user who never picked a theme keeps following the system preference.
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  useEffect(() => {
    localStorage.setItem('mangaocr_font', fontFamily);
    const f = FONTS.find((x) => x.id === fontFamily) || FONTS[0];
    document.documentElement.style.setProperty('--app-font', f.stack);
  }, [fontFamily]);
  useEffect(() => {
    localStorage.setItem('mangaocr_scale', String(fontScale));
    document.documentElement.style.setProperty('--font-scale', String(fontScale));
  }, [fontScale]);

  const setTheme = (t) => {
    localStorage.setItem('mangaocr_theme', t);
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontFamily, setFontFamily, fontScale, setFontScale }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);