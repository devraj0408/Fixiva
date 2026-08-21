import { createContext, useContext, useState, useEffect } from 'react';
import { translations, LANGUAGES } from '../lib/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('fixiva_language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('fixiva_language', language);
  }, [language]);

  const changeLanguage = (code) => {
    if (translations[code]) {
      setLanguage(code);
    }
  };

  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations['en'];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return translations['en']?.[key] || fallback || key;
  };

  const currentLangObj = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: LANGUAGES, currentLangObj }}>
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
