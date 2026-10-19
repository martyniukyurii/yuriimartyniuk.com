"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  IconUser,
  IconCode,
  IconArticle,
  IconHeartHandshake,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";

import { SectionType, useSection } from "./section-provider";

import { ThemeSwitch } from "@/components/theme-switch";
import { FloatingDock } from "@/components/ui/floating-dock";
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

export function FloatingDockDemo({ id }: { id?: string }) {
  const { activeSection, setActiveSection } = useSection();
  const pathname = usePathname();
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<SectionType>("about");
  const [showDock, setShowDock] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const dockRef = useRef<HTMLDivElement>(null);

  const indicatorTimer = useRef<NodeJS.Timeout | null>(null);
  const { t, language } = useTranslation();

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
          !(event.target as Element).closest("[data-dock-trigger]")) {
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

  useEffect(() => () => {
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
  }, []);

  const handleSectionChange = (section: SectionType) => {
    console.log("Changing section to:", section);
    setActiveSection(section);
    if (pathname === '/') window.location.hash = section;
    else router.push(`/#${section}`);
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
    if (isMobile) return;
    if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
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
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <LanguageSwitch />
        </motion.div>
        <motion.div 
          className="p-2.5 bg-white/10 backdrop-blur-md rounded-full shadow-lg h-10 w-10 flex items-center justify-center"
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 17 
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <ThemeSwitch />
        </motion.div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 h-40 z-50 pointer-events-none" id={id}>
        <AnimatePresence>
          {!isMobile && (
            <motion.div
              animate={{ opacity: showDock ? 0 : 1, y: 0 }}
              className="absolute z-10 bottom-8 inset-x-0 flex justify-center pointer-events-none"
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
            >
              <button
                data-dock-trigger
                aria-expanded={showDock}
                aria-label={language === "uk" ? "Відкрити меню" : "Open menu"}
                className="cursor-pointer pointer-events-auto rounded-full"
                type="button"
                onClick={handleIndicatorMouseEnter}
                onFocus={(event) => {
                  if (!event.currentTarget.matches(":focus-visible")) return;
                  handleIndicatorMouseEnter();
                  requestAnimationFrame(() => dockRef.current?.querySelector<HTMLButtonElement>("button")?.focus());
                }}
                onMouseEnter={handleIndicatorMouseEnter}
                onMouseLeave={handleDockMouseLeave}
              >
                <DockHandle activeSection={currentSection} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Флоатінг Док */}
        <AnimatePresence>
          {(showDock || isMobile) && (
            <motion.div 
              ref={dockRef}
              animate={{ opacity: 1, y: 0 }}
              className={`absolute bottom-8 pointer-events-auto ${isMobile ? 'left-4 right-auto' : 'left-0 right-0 flex justify-center'}`}
              exit={{ opacity: 0, y: 20 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ 
                type: "spring", 
                damping: 25, 
                stiffness: 300 
              }}
              onFocusCapture={handleDockMouseEnter}
              onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) handleDockMouseLeave();
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape") setShowDock(false);
              }}
              onMouseEnter={handleDockMouseEnter}
              onMouseLeave={handleDockMouseLeave}
            >
              <FloatingDock
                items={links}
                menuLabel={language === "uk" ? "Меню" : "Menu"}
                mobileTrigger={(open) => <DockHandleRound open={open} />}
                mobileClassName="translate-y-0 flex justify-start"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

const sectionOrder: SectionType[] = ["about", "projects", "blog", "activism", "contacts"];

// Кольори крапок для світіння (відповідають sectionBgColors)
const sectionGlowColors: Record<SectionType, string> = {
  about: "#3b82f6",
  projects: "#10b981",
  blog: "#8b5cf6",
  activism: "#ec4899",
  contacts: "#f59e0b",
};

// Згорнутий док: скляна капсула з переливчастим бордером і крапками секцій, що по черзі світяться
function DockHandle({ activeSection }: { activeSection: SectionType }) {
  return (
    <span className="dock-handle flex items-center gap-2.5 rounded-full px-5 py-3.5 bg-white/20 backdrop-blur-xl shadow-lg">
      {sectionOrder.map((section, index) => (
        <span
          key={section}
          className={`dock-handle-dot block h-2.5 rounded-full transition-[width] duration-500 ${sectionBgColors[section]} ${section === activeSection ? "w-7" : "w-2.5"}`}
          style={{ "--dot-color": sectionGlowColors[section], animationDelay: `${index * 0.6}s` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

// Мобільна версія ручки: кругла кнопка розміром з пункти меню, крапки секцій по колу
function DockHandleRound({ open }: { open: boolean }) {
  return (
    <span className="dock-handle relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xl shadow-lg">
      {open ? (
        <IconX className="h-4 w-4 text-white" />
      ) : (
        sectionOrder.map((section, index) => {
          const angle = (index / sectionOrder.length) * 2 * Math.PI - Math.PI / 2;

          return (
            <span
              key={section}
              className={`dock-handle-dot absolute block h-1.5 w-1.5 rounded-full ${sectionBgColors[section]}`}
              style={{
                "--dot-color": sectionGlowColors[section],
                animationDelay: `${index * 0.6}s`,
                transform: `translate(${Math.cos(angle) * 8}px, ${Math.sin(angle) * 8}px)`,
              } as React.CSSProperties}
            />
          );
        })
      )}
    </span>
  );
}
