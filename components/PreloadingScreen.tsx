"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { useTranslation } from "@/lib/hooks/useTranslation";

// Список всіх файлів, які потрібно попередньо завантажити
const filesToPreload = [
  // Головні фото
  "/main_my_photos/image1.png",
  "/main_my_photos/image2.png",
  "/main_my_photos/image3.png",
  "/main_my_photos/image4.png",
  "/main_my_photos/image5.png",
  "/main_my_photos/image_background.png",
  
  // Технічні іконки
  "/tech_icons/python.svg",
  "/tech_icons/react.svg",
  "/tech_icons/mongodb.svg",
  "/tech_icons/typescript.svg",
  "/tech_icons/docker.svg",
  "/tech_icons/flutter.svg",
  
  // Логотипи
  "/logos_job/logo_ugb.jpg",
  "/logos_job/logo_mediamood.png",
  "/logos_job/logo_vishunka.png",
  "/logos_job/logo_fsymvoly.jpeg",
  
  // 3D моделі
  "/3D_models/origami_unicorn.glb",
  "/3D_models/bicycle.glb",
  "/3D_models/macbook_laptop.glb",
  "/3D_models/chess_piece_knight_horse.glb",
];

export function PreloadingScreen() {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const { language } = useTranslation();
  
  useEffect(() => {
    // Функція для попереднього завантаження зображень
    const preloadImages = async () => {
      const totalFiles = filesToPreload.length;
      let loadedFiles = 0;
      
      const preloadPromises = filesToPreload.map((file) => {
        return new Promise<void>((resolve) => {
          if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.svg')) {
            // Завантаження зображень
            const img = new Image();

            img.src = file;
            img.onload = () => {
              loadedFiles++;
              setProgress(Math.floor((loadedFiles / totalFiles) * 100));
              resolve();
            };
            img.onerror = () => {
              loadedFiles++;
              setProgress(Math.floor((loadedFiles / totalFiles) * 100));
              resolve();
            };
          } else if (file.endsWith('.glb')) {
            // Завантаження 3D моделей
            fetch(file)
              .then(_response => {
                loadedFiles++;
                setProgress(Math.floor((loadedFiles / totalFiles) * 100));
                resolve();
              })
              .catch(() => {
                loadedFiles++;
                setProgress(Math.floor((loadedFiles / totalFiles) * 100));
                resolve();
              });
          } else {
            // Інші типи файлів
            fetch(file)
              .then(() => {
                loadedFiles++;
                setProgress(Math.floor((loadedFiles / totalFiles) * 100));
                resolve();
              })
              .catch(() => {
                loadedFiles++;
                setProgress(Math.floor((loadedFiles / totalFiles) * 100));
                resolve();
              });
          }
        });
      });
      
      // Очікуємо завантаження всіх файлів
      await Promise.all(preloadPromises);
      
      // Додаємо невелику затримку для плавності відображення
      setTimeout(() => {
        setLoading(false);
      }, 500);
    };
    
    preloadImages();
  }, []);
  
  return (
    <AnimatePresence onExitComplete={() => {
      window.dispatchEvent(new Event("portfolio:ready"));
      document.documentElement.dataset.portfolioReady = "true";
    }}>
      {loading && (
        <motion.div
          aria-label={language === "uk" ? "Завантаження сайту" : "Loading the site"}
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#140b2e]"
          exit={{ opacity: 0, scale: 1.04, filter: "blur(8px)" }}
          initial={{ opacity: 1 }}
          role="status"
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* М'які кольорові плями на фоні — ті ж кольори, що й у навігації */}
          <div aria-hidden className="preloader-aurora absolute inset-0" />

          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="relative flex flex-col items-center"
            initial={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="preloader-ring relative flex h-24 w-24 items-center justify-center rounded-full md:h-28 md:w-28">
              <span className="text-2xl font-semibold tracking-tight text-white md:text-3xl">
                {language === "uk" ? "ЮМ" : "YM"}
              </span>
            </div>

            <p className="mt-8 text-sm font-medium uppercase tracking-[0.3em] text-white/70">
              {language === "uk" ? "Юрій Мартинюк" : "Yurii Martyniuk"}
            </p>

            <div className="mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/10 md:w-64">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-pink-500"
                initial={{ width: 0 }}
                transition={{ ease: "easeOut", duration: 0.4 }}
              />
            </div>

            <p className="mt-3 text-xs tabular-nums text-white/50">{progress}%</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 