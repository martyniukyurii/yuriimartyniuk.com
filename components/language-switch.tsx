"use client";

import { FC, useEffect } from "react";

import { useLanguage } from "./language-provider";

export interface LanguageSwitchProps {
  className?: string;
}

export const LanguageSwitch: FC<LanguageSwitchProps> = ({
  className
}) => {
  const { language, setLanguage } = useLanguage();

  // Відстежуємо зміни мови
  useEffect(() => {
    console.log("LanguageSwitch - Current language:", language);
  }, [language]);

  const toggleLanguage = () => {
    const newLanguage = language === "uk" ? "en" : "uk";

    console.log("LanguageSwitch - Switching language from", language, "to", newLanguage);
    setLanguage(newLanguage);
  };

  return (
    <button
      aria-label={`Switch to ${language === "uk" ? "English" : "Ukrainian"} language`}
      className="cursor-pointer text-sm font-medium"
      onClick={toggleLanguage}
    >
      {language === "uk" ? "EN" : "UA"}
    </button>
  );
}; 