"use client";
import { useScroll, useTransform } from "motion/react";
import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export const ParallaxScrollAdaptive = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Використовуємо глобальний скролінг сторінки замість внутрішнього скролінгу
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"] // Починаємо ефект ще до того, як компонент повністю видно
  });

  // Ще більш амплітуда для максимально виразного ефекту
  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -400]);

  // Розподіляємо зображення між колонками по порядку зліва направо
  const columns = 3; // Кількість колонок
  const columnImages: string[][] = Array.from({ length: columns }, () => []);
  
  // Рівномірно розподіляємо зображення по колонках у порядку зліва направо
  images.forEach((image, index) => {
    const columnIndex = index % columns; // Визначаємо колонку за залишком від ділення
    columnImages[columnIndex].push(image);
  });

  // Функція для визначення орієнтації зображення
  const ImageItem = ({ src, index, columnIndex }: { src: string; index: number; columnIndex: number }) => {
    const [isHorizontal, setIsHorizontal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      // Перевіряємо орієнтацію зображення
      const img = new window.Image();
      img.onload = () => {
        setIsHorizontal(img.width > img.height);
        setIsLoaded(true);
      };
      img.src = src;
    }, [src]);

    // Вибираємо відповідне перетворення
    const translateY = columnIndex === 0 
      ? translateFirst 
      : columnIndex === 1 
        ? translateSecond 
        : translateThird;

    return (
      <motion.div 
        style={{ y: translateY }} 
        key={`grid-${columnIndex}-${index}`}
        className="relative rounded-lg overflow-hidden mb-6 will-change-transform"
      >
        {isLoaded ? (
          <div 
            className={cn(
              "w-full relative overflow-hidden rounded-lg",
              isHorizontal ? "h-[250px]" : "h-[350px]" // Фіксована висота відповідно до орієнтації
            )}
          >
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent to-black/20 dark:to-black/40">
              <img
                src={src}
                className={cn(
                  "w-full h-full",
                  isHorizontal 
                    ? "object-cover object-center" 
                    : "object-cover object-center"
                )}
                alt="галерея активізму"
                loading="lazy"
              />
            </div>
          </div>
        ) : (
          <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"></div>
        )}
      </motion.div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("w-full pointer-events-none", className)} // Відключаємо події миші для компонента
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start max-w-5xl mx-auto gap-6 py-10 px-4"
      >
        {columnImages.map((column, colIndex) => (
          <div key={`column-${colIndex}`} className="grid">
            {column.map((image, imgIndex) => (
              <ImageItem 
                key={`img-${colIndex}-${imgIndex}`} 
                src={image} 
                index={imgIndex}
                columnIndex={colIndex}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}; 