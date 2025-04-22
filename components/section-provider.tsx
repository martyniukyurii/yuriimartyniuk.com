"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";

// Типи секцій, які ми будемо використовувати
export type SectionType = 
  | "about" 
  | "projects" 
  | "blog" 
  | "activism" 
  | "contacts";

// Визначення інтерфейсу для контексту секцій
interface SectionContextType {
  activeSection: SectionType;
  setActiveSection: (section: SectionType) => void;
  lastActiveSection: SectionType | null; // Додаємо відстеження останньої активної секції
  resetModels: () => void; // Додаємо функцію для скидання моделей
}

// Створення контексту з початковими значеннями
const SectionContext = createContext<SectionContextType>({
  activeSection: "about",
  setActiveSection: () => {},
  lastActiveSection: null,
  resetModels: () => {},
});

// Кастомний хук для використання контексту
export const useSection = () => useContext(SectionContext);

// Створення події для оновлення 3D моделей
export const MODEL_RESET_EVENT = 'model-reset-event';

// Інтерфейс для провайдера
interface SectionProviderProps {
  children: ReactNode;
}

// Провайдер для контексту
export function SectionProvider({ children }: SectionProviderProps) {
  const [activeSection, setActiveSection] = useState<SectionType>("about");
  const [lastActiveSection, setLastActiveSection] = useState<SectionType | null>(null);
  
  // Оновлення секції при зміні URL хеша
  useEffect(() => {
    const updateSectionFromHash = () => {
      // Отримуємо хеш з URL
      const hash = window.location.hash.replace('#', '') as SectionType;
      
      // Якщо хеш є дійсною секцією (about, projects, blog, activism, contacts)
      if (hash && ["about", "projects", "blog", "activism", "contacts"].includes(hash)) {
        // Зберігаємо попередню секцію тільки при зміні
        if (activeSection !== hash) {
          setLastActiveSection(activeSection);
          setActiveSection(hash);
          console.log(`Navigation: ${activeSection} -> ${hash}`);
        }
      }
    };
    
    // Виконуємо один раз при завантаженні
    updateSectionFromHash();
    
    // Додаємо обробник події зміни хеша
    window.addEventListener('hashchange', updateSectionFromHash);
    
    // Очищення обробника при розмонтуванні
    return () => {
      window.removeEventListener('hashchange', updateSectionFromHash);
    };
  }, [activeSection]);

  // Функція для активації події оновлення моделей
  const resetModels = () => {
    if (typeof window !== 'undefined') {
      // Створюємо та відправляємо подію для оновлення моделей
      const event = new CustomEvent(MODEL_RESET_EVENT);
      window.dispatchEvent(event);
    }
  };
  
  // Виконуємо скидання моделей при переході між секціями
  useEffect(() => {
    // Перезавантажуємо моделі тільки якщо:
    // 1. Попередня секція не була 'about'
    // 2. Нова секція - 'about'
    // 3. Був здійснений перехід між сторінками
    if (lastActiveSection !== null && 
        lastActiveSection !== 'about' && 
        activeSection === 'about') {
      console.log('Resetting 3D models after returning to About section');
      resetModels();
    }
  }, [activeSection, lastActiveSection]);

  return (
    <SectionContext.Provider value={{ activeSection, setActiveSection, lastActiveSection, resetModels }}>
      {children}
    </SectionContext.Provider>
  );
} 