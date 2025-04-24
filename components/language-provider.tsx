"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from "react";

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
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>("uk");

  // Зберігаємо вибрану мову в localStorage
  useEffect(() => {
    // Код виконується тільки на клієнті
    if (typeof window !== 'undefined') {
      // Зчитуємо мову з localStorage при ініціалізації
      const savedLanguage = localStorage.getItem("language") as Language | null;

      console.log("Initial language from localStorage:", savedLanguage);
      
      if (savedLanguage && (savedLanguage === "uk" || savedLanguage === "en")) {
        console.log("Setting initial language to:", savedLanguage);
        setLanguage(savedLanguage);
      }

      // Встановлюємо атрибут lang для елемента html
      document.documentElement.lang = language;
    }
  }, []);

  // Оновлюємо localStorage при зміні мови
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log("Language changed to:", language);
      localStorage.setItem("language", language);
      document.documentElement.lang = language;
      
      // Додатково викликаємо подію для перезавантаження компонентів, які реагують на зміну мови
      const languageChangeEvent = new CustomEvent('languagechange', { detail: { language } });

      window.dispatchEvent(languageChangeEvent);
    }
  }, [language]);

  const handleSetLanguage = (newLanguage: Language) => {
    console.log("Setting language to:", newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}; 