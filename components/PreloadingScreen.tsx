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
    <AnimatePresence>
      {loading && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-blue-900/80 to-black/90 backdrop-blur-lg"
          exit={{ opacity: 0 }}
          initial={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          <motion.div
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
            initial={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
              {language === 'uk' ? 'Завантаження...' : 'Loading...'}
            </h1>
            
            <div className="w-64 md:w-80 h-3 md:h-4 bg-white/20 rounded-full overflow-hidden mb-4 mx-auto">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
              />
            </div>
            
            <p className="text-lg md:text-xl text-white">
              {progress}%
            </p>
            
            <p className="text-sm md:text-base text-white/60 mt-8 max-w-md mx-auto">
              {language === 'uk' 
                ? 'Завантажуємо всі необхідні ресурси для найкращого досвіду перегляду сайту' 
                : 'Loading all necessary resources for the best site viewing experience'}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 