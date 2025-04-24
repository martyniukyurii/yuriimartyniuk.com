"use client";

import React from "react";

import { useLanguage } from "@/components/language-provider";
import { getTranslation, TranslationKey } from "@/lib/translations";

interface TranslatedTextProps {
  translationKey: TranslationKey;
  className?: string;
}

export function TranslatedText({ translationKey, className }: TranslatedTextProps) {
  const { language } = useLanguage();
  
  return (
    <span className={className}>
      {getTranslation(translationKey, language)}
    </span>
  );
} 