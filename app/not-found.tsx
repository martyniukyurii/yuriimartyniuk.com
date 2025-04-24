"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

import { useTranslation } from "@/lib/hooks/useTranslation";

export default function NotFound() {
  const { t, language } = useTranslation();
  const [randomNum, setRandomNum] = useState(0);

  useEffect(() => {
    // Генеруємо випадкове число від 1 до 5 при завантаженні сторінки
    setRandomNum(Math.floor(Math.random() * 5) + 1);
    
    // Приховуємо dock тільки на сторінці 404
    const hideDock = () => {
      const mainDock = document.getElementById('main-floating-dock');

      if (mainDock) {
        mainDock.style.display = 'none';
      }
    };
    
    // Виконуємо з невеликою затримкою, щоб DOM точно встиг завантажитись
    setTimeout(hideDock, 100);
    
    // Прибираємо стиль приховування при розмонтуванні компонента
    return () => {
      const mainDock = document.getElementById('main-floating-dock');

      if (mainDock) {
        mainDock.style.display = '';
      }
    };
  }, []);

  // Визначаємо тексти для кожної фотографії обома мовами
  const imageTexts = {
    uk: [
      "Ви не туди попали, тут тільки моє фото", // image1
      "404 - Сторінка не знайдена", // image2
      "Нічого не знайдете, лише мене у шоломі", // image3 - скорочено
      "Ви попали у інший вимір, де я став справжнім психотерапевтом", // image4
      "Вітаю, ви знайшли мене в костюмі", // image5
      "КОФТИК ЗНАЙШОВ ТЕБЕ" // image6
    ],
    en: [
      "You came to the wrong place, there's only my photo here", // image1
      "404 - Page Not Found", // image2
      "Nothing here except me in a helmet", // image3 - скорочено
      "You've entered another dimension where I became a real psychotherapist", // image4
      "Congratulations, you found me in a suit", // image5
      "THE SWEATER HAS FOUND YOU" // image6
    ]
  };

  const imageToShow = randomNum === 2 ? 2 : randomNum; // Якщо випадкове число 2, використовуємо image2 (основне для 404)
  const textToShow = imageTexts[language][imageToShow - 1];
  
  return (
    <div className="min-h-screen flex flex-col md:flex-row items-center py-0 relative overflow-hidden">
      {/* Ліва частина - текст */}
      <div className="w-full md:w-1/2 mb-10 md:mb-0 flex flex-col justify-center items-center md:items-start px-4 md:px-10 z-10 pt-20 md:pt-0 pb-10 md:pb-24">
        <motion.h1 
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-bold mb-6 text-center md:text-left"
          initial={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          {textToShow}
        </motion.h1>
        
        <motion.p 
          animate={{ opacity: 1 }}
          className="text-lg md:text-2xl text-gray-300 mb-8 text-center md:text-left"
          initial={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {language === 'uk' 
            ? 'Але ви завжди можете повернутися на головну сторінку' 
            : 'But you can always return to the main page'}
        </motion.p>
        
        <Link legacyBehavior href="/">
          <motion.a 
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all duration-300"
            initial={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {language === 'uk' ? 'На головну' : 'Back to Home'}
          </motion.a>
        </Link>
      </div>
      
      {/* Права частина - фотографія (як в about-section) */}
      <div className="w-full md:w-1/2 md:absolute md:right-0 md:top-0 md:bottom-0 h-[60vh] md:h-full">
        {/* Фонове зображення */}
        <div className="absolute bottom-0 z-0 flex justify-center w-full h-full">
          <div className="relative w-full h-full">
            <Image
              fill
              alt="Фон"
              className="object-contain object-bottom"
              priority={true}
              sizes="(max-width: 768px) 100vw, 50vw"
              src="/main_my_photos/image_background.png?v=1"
              style={{
                scale: "1.25",
                transform: "translateY(-15%) translateX(3%)"
              }}
            />
          </div>
        </div>
        {/* Основне фото */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="h-full flex justify-center md:justify-end overflow-hidden relative"
          initial={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.8 }}
        >
          <Image
            alt={`Юрій Мартинюк фото 404`}
            className="z-10 relative h-full"
            height={1500}
            priority={true}
            src={`/main_my_photos/image${imageToShow}.png?v=1`}
            style={{
              width: "auto",
              objectFit: "contain",
              objectPosition: "center bottom",
              maxHeight: "100%",
              marginBottom: "-15px"
            }}
            width={1000}
          />
        </motion.div>
      </div>
    </div>
  );
} 