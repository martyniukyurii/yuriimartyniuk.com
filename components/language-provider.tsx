"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

import { LANGUAGE_COOKIE, LANGUAGE_COOKIE_MAX_AGE } from "@/lib/language-detection";

export type Language = "uk" | "en";

interface LanguageContextProps {
  language: Language;
  setLanguage: (language: Language) => void;
}

const defaultLanguageContext: LanguageContextProps = {
  language: "uk",
  setLanguage: () => {},
};

const LanguageContext = createContext<LanguageContextProps>(defaultLanguageContext);

export const useLanguage = () => useContext(LanguageContext);

interface LanguageProviderProps {
  children: ReactNode;
  // Мова, визначена на сервері (cookie → IP → мова браузера)
  initialLanguage?: Language;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children, initialLanguage = "uk" }) => {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;

    // Повідомляємо компоненти, які реагують на зміну мови
    window.dispatchEvent(new CustomEvent('languagechange', { detail: { language } }));
  }, [language]);

  // Ручний вибір мови запам'ятовуємо в cookie, щоб сервер одразу віддавав потрібну мову
  const handleSetLanguage = (newLanguage: Language) => {
    document.cookie = `${LANGUAGE_COOKIE}=${newLanguage}; path=/; max-age=${LANGUAGE_COOKIE_MAX_AGE}; samesite=lax`;
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
