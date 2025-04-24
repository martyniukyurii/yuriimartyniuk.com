"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import { useSection } from "./section-provider";

// Кольори хвилі для різних секцій
const sectionColors = {
  about: "#3B82F6", // blue-500
  projects: "#10B981", // emerald-500
  blog: "#8B5CF6", // violet-500
  activism: "#EC4899", // pink-500
  contacts: "#F59E0B", // amber-500
};

export function PageTransition() {
  const { activeSection } = useSection();
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevSection, setPrevSection] = useState(activeSection);
  const [color, setColor] = useState(sectionColors[activeSection]);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    if (prevSection !== activeSection) {
      // Запускаємо анімацію
      setIsAnimating(true);
      setColor(sectionColors[activeSection]);
      
      // Через 400мс показуємо затемнення на весь екран
      const showFadeTimer = setTimeout(() => {
        setShowFade(true);
      }, 400);
      
      // Через 700мс завершуємо анімацію
      const animationTimer = setTimeout(() => {
        setShowFade(false);
        setIsAnimating(false);
        setPrevSection(activeSection);
      }, 700);
      
      return () => {
        clearTimeout(showFadeTimer);
        clearTimeout(animationTimer);
      };
    }
  }, [activeSection, prevSection]);

  return (
    <AnimatePresence mode="wait">
      {isAnimating && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden">
          {/* Фонове затемнення на весь екран */}
          <AnimatePresence mode="wait">
            {showFade && (
              <motion.div 
                animate={{ opacity: 0.2 }}
                className="absolute inset-0"
                exit={{ opacity: 0 }}
                initial={{ opacity: 0 }}
                style={{ backgroundColor: color }}
                transition={{ 
                  duration: 0.15,
                  ease: "easeOut" 
                }}
              />
            )}
          </AnimatePresence>
          
          {/* Краплина, яка розширюється з центру */}
          <motion.div
            key={activeSection}
            animate={{ 
              scale: 25, 
              borderRadius: "100%" 
            }}
            exit={{ 
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeOut"
              }
            }}
            initial={{ scale: 0, borderRadius: "100%" }}
            style={{ 
              backgroundColor: color,
              width: "150px",
              height: "150px",
              opacity: 0.15
            }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 30,
              duration: 0.6
            }}
          />
        </div>
      )}
    </AnimatePresence>
  );
} 