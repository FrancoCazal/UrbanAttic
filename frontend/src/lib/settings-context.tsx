import { createContext, useContext, useState, useEffect } from 'react';
import { translations, type Locale, type Translations } from './i18n';

type Theme = 'light' | 'dark';

interface SettingsContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: Translations;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('ua-locale') as Locale) || 'en';
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('ua-theme') as Theme) || 'light';
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem('ua-locale', l);
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem('ua-theme', t);
  };

  // Apply dark class to html element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const t = translations[locale];

  return (
    <SettingsContext.Provider value={{ locale, setLocale, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function useT() {
  return useSettings().t;
}
