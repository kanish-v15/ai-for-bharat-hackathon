import { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES } from '../utils/constants';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('swasthya-lang') || 'hindi';
  });

  useEffect(() => {
    localStorage.setItem('swasthya-lang', language);
  }, [language]);

  const langConfig = LANGUAGES[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, langConfig }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
