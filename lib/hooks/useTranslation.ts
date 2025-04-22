"use client";

import { useLanguage } from "@/components/language-provider";
import { getTranslation, TranslationKey } from "@/lib/translations";
import { useEffect, useState } from 'react';

export function useTranslation() {
  const { language, setLanguage } = useLanguage();
  const [currentLang, setCurrentLang] = useState(language);

  useEffect(() => {
    setCurrentLang(language);
  }, [language]);

  function t(key: TranslationKey, params?: Record<string, string | number>) {
    let text = getTranslation(key, currentLang);
    
    if (params) {
      // Замінюємо всі {{param}} на значення з об'єкта params
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        text = text.replace(new RegExp(`{{${paramKey}}}`, 'g'), paramValue.toString());
      });
    }
    
    return text;
  }

  return { t, language: currentLang, setLanguage };
} 