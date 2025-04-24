"use client";

import { useState, useEffect } from "react";
import { addToast } from "@heroui/react";
import { IconChevronUp } from "@tabler/icons-react";

import { MainContent } from '@/components/main-content';
import { useTranslation } from "@/lib/hooks/useTranslation";

export default function HomePage() {
  const { t, language } = useTranslation();
  const [toastShown, setToastShown] = useState(false);
  
  // Показуємо тост з підказкою при завантаженні сторінки
  useEffect(() => {
    // Перевіряємо, чи код виконується в браузері
    if (typeof window !== 'undefined' && !toastShown) {
      console.log("Показуємо тост...");
      
      // Збільшена затримка для кращого UX після завантаження сторінки
      const timer = setTimeout(() => {
        console.log("Виконую addToast...");
        
        try {
          // Викликаємо тост з новими параметрами
          addToast({
            title: t("navigation.hint.title"),
            description: t("navigation.hint.description"),
            icon: <IconChevronUp className="text-blue-400" />,
            color: "primary",
            variant: "solid",
            timeout: 6000,
            shouldShowTimeoutProgress: true,
          });
          
          setToastShown(true);
          console.log("Toast успішно доданий");
        } catch (error) {
          console.error("Помилка під час показу тосту:", error);
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [t, toastShown]); // Залежність від t та toastShown

  return <MainContent />;
}
