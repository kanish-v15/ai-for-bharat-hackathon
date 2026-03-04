import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES } from '../utils/constants';
import { translations } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('swasthya-lang') || 'hindi';
  });

  useEffect(() => {
    localStorage.setItem('swasthya-lang', language);
  }, [language]);

  const langConfig = LANGUAGES[language];

  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (!value) break;
      value = value[k];
    }
    // Fallback to English
    if (value === undefined || value === null) {
      value = translations.english;
      for (const k of keys) {
        if (!value) break;
        value = value[k];
      }
    }
    return value || key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, langConfig, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
