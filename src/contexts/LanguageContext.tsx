// src/contexts/LanguageContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { translations } from '../translations';

interface LanguageContextType {
  language: 'en' | 'ka';
  setLanguage: (language: 'en' | 'ka') => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<'en' | 'ka'>(
    (localStorage.getItem('language') as 'en' | 'ka') || 'en'
  );

  const setLanguage = (lang: 'en' | 'ka') => {
    localStorage.setItem('language', lang);
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};