"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FloatingDock } from "@/components/ui/floating-dock";
import {
  IconBrandGithub,
  IconUser,
  IconCode,
  IconArticle,
  IconHeartHandshake,
  IconMail,
  IconChevronUp
} from "@tabler/icons-react";
import { SectionType, useSection } from "./section-provider";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeSwitch } from "@/components/theme-switch";
import { useTheme } from "next-themes";
import { LanguageSwitch } from "@/components/language-switch";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Кольори фону для різних секцій (завжди кольорові)
const sectionBgColors = {
  about: "bg-blue-500 dark:bg-blue-600",
  projects: "bg-emerald-500 dark:bg-emerald-600",
  blog: "bg-violet-500 dark:bg-violet-600",
  activism: "bg-pink-500 dark:bg-pink-600",
  contacts: "bg-amber-500 dark:bg-amber-600",
};

// Колір іконок для звичайного та активного стану
const iconColors = {
  default: "text-white/70",
  active: "text-white"
};

export function FloatingDockDemo() {
  const { activeSection, setActiveSection } = useSection();
  const [currentSection, setCurrentSection] = useState<SectionType>("about");
  const [showDock, setShowDock] = useState(false);
  const [showIndicator, setShowIndicator] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const indicatorTimer = useRef<NodeJS.Timeout | null>(null);
  const { theme } = useTheme();
  const { t, language } = useTranslation();

  // Додаємо useEffect для відстеження монтування компоненту
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Перевіряємо, чи це мобільний пристрій
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Закриття доку при кліку за його межами
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDock && 
          dockRef.current && 
          !dockRef.current.contains(event.target as Node) &&
          tooltipRef.current && 
          !tooltipRef.current.contains(event.target as Node)) {
        setShowDock(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDock]);

  // Синхронізуємо поточну секцію з активною для анімації
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSection(activeSection);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [activeSection]);

  // Відстежуємо зміни мови
  useEffect(() => {
    console.log("FloatingDockDemo - Current language:", language);
  }, [language]);

  const handleSectionChange = (section: SectionType) => {
    console.log("Changing section to:", section);
    setActiveSection(section);
    window.location.hash = section;
  };

  // Функція для обробки появи/зникнення доку
  const handleIndicatorMouseEnter = () => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
    setShowDock(true);
  };

  const handleDockMouseEnter = () => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
  };

  const handleDockMouseLeave = () => {
    const timeout = setTimeout(() => {
      setShowDock(false);
    }, 300); // Швидке зникнення при відведенні курсора
    indicatorTimer.current = timeout;
  };

  // Навігаційні посилання з підписами відповідно до секцій
  const links = [
    {
      id: "about",
      label: t("navigation.about"),
      icon: <IconUser className="h-full w-full" />,
      onClick: () => handleSectionChange("about"),
      bgColor: sectionBgColors.about,
      isActive: currentSection === "about",
    },
    {
      id: "projects",
      label: t("navigation.projects"),
      icon: <IconCode className="h-full w-full" />,
      onClick: () => handleSectionChange("projects"),
      bgColor: sectionBgColors.projects,
      isActive: currentSection === "projects",
    },
    {
      id: "blog",
      label: t("navigation.blog"),
      icon: <IconArticle className="h-full w-full" />,
      onClick: () => handleSectionChange("blog"),
      bgColor: sectionBgColors.blog,
      isActive: currentSection === "blog",
    },
    {
      id: "activism",
      label: t("navigation.activism"),
      icon: <IconHeartHandshake className="h-full w-full" />,
      onClick: () => handleSectionChange("activism"),
      bgColor: sectionBgColors.activism,
      isActive: currentSection === "activism",
    },
    {
      id: "contacts",
      label: t("navigation.contacts"),
      icon: <IconMail className="h-full w-full" />,
      onClick: () => handleSectionChange("contacts"),
      bgColor: sectionBgColors.contacts,
      isActive: currentSection === "contacts",
    },
  ];

  return (
    <>
      {/* Перемикач теми у правому верхньому куті */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <motion.div 
          className="p-2.5 bg-white/10 backdrop-blur-md rounded-full shadow-lg h-10 w-10 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          }}
        >
          <LanguageSwitch />
        </motion.div>
        <motion.div 
          className="p-2.5 bg-white/10 backdrop-blur-md rounded-full shadow-lg h-10 w-10 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          }}
        >
          <ThemeSwitch />
        </motion.div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 h-40 z-50 pointer-events-none">
        <AnimatePresence>
          {showIndicator && !isMobile && !showDock && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-5 left-1/2 -translate-x-1/2 w-8 h-8 flex items-center justify-center cursor-pointer pointer-events-auto"
              onMouseEnter={handleIndicatorMouseEnter}
            >
              <motion.div 
                animate={{ y: [2, -2, 2] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className={isMounted ? `${theme === 'light' ? 'bg-blue-600/50' : 'bg-white/20'} backdrop-blur-md rounded-full p-1.5 shadow-lg` : 'bg-white/20 backdrop-blur-md rounded-full p-1.5 shadow-lg'}
              >
                <IconChevronUp className={isMounted ? `h-3 w-3 ${theme === 'light' ? 'text-blue-100' : 'text-white'}` : 'h-3 w-3 text-white'} />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Флоатінг Док */}
        <AnimatePresence>
          {(showDock || isMobile) && (
            <motion.div 
              ref={dockRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300 
              }}
              className={`absolute bottom-8 pointer-events-auto ${isMobile ? 'left-4 right-auto' : 'left-0 right-0 flex justify-center'}`}
              onMouseEnter={handleDockMouseEnter}
              onMouseLeave={handleDockMouseLeave}
            >
              <FloatingDock
                mobileClassName="translate-y-0 flex justify-start"
                items={links}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
} 