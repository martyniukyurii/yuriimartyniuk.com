"use client";
import { useState, useEffect, useRef } from "react";
import { useScroll, useTransform, motion } from "motion/react";

import { useTranslation } from "@/lib/hooks/useTranslation";
import { TranslationKey } from "@/lib/translations";

type ImageItem = {
  src: string;
  index: number;
};

// Масив описів фотографій вже не потрібен, оскільки використовуємо переклади
// const photoDescriptions = [
//   "В процесі роботи",
//   "Фінал OpenDataAccelerator",
//   "Презентація проекту на Hackers League Hackathon",
//   ...
// ];

export const ParallaxScrollFocusSimple = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Використовуємо глобальний скролінг сторінки
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Різна амплітуда паралаксу для кожної колонки
  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -400]);

  // Переконуємось, що код виконується лише на клієнтській стороні
  useEffect(() => {
    setMounted(true);
  }, []);

  // Отримання опису для фото за індексом з перекладів
  const getPhotoDescription = (index: number): string => {
    const translationKey = `gallery.photo.${index + 1}` as TranslationKey;

    return t(translationKey) || `Фото ${index + 1}`;
  };

  // Організуємо зображення у три колонки
  const getImages = () => {
    const columns: ImageItem[][] = [[], [], []];

    images.forEach((image, index) => {
      columns[index % 3].push({
        src: image,
        index
      });
    });

    return columns;
  };

  if (!mounted) {
    return (
      <div className="w-full py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-full h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const imageColumns = getImages();

  return (
    <div ref={containerRef} className={`w-full ${className || ''}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4 py-10">
        {imageColumns.map((column, colIndex) => {
          // Обираємо відповідне трансформування для колонки
          const translateY = colIndex === 0 
            ? translateFirst 
            : colIndex === 1 
              ? translateSecond 
              : translateThird;
          
          return (
            <motion.div 
              key={`col-${colIndex}`} 
              className="flex flex-col gap-6"
              style={{ y: translateY }}
            >
              {column.map((item: ImageItem) => (
                <div 
                  key={`img-${item.index}`}
                  className="relative overflow-hidden rounded-lg"
                  onMouseEnter={() => setHovered(item.index)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <div className={`
                    transition-all duration-300 ease-in-out
                    ${hovered !== null && hovered !== item.index ? 'blur-sm scale-95 opacity-60' : ''}
                  `}>
                    <img 
                      alt={getPhotoDescription(item.index)}
                      className="w-full h-auto rounded-lg object-cover"
                      loading="lazy"
                      src={item.src}
                      style={{
                        minHeight: "280px", 
                        maxHeight: "400px"
                      }}
                    />
                  </div>
                  
                  {hovered === item.index && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end p-4 animate-fadeIn">
                      <span className="text-lg font-medium text-white">
                        {getPhotoDescription(item.index)}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}; 