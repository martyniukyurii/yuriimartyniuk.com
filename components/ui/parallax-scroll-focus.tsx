"use client";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export const ParallaxScrollFocus = ({
  images,
  className,
}: {
  images: string[];
  className?: string;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Перевірка, що ми на клієнтській стороні
  useEffect(() => {
    setIsClient(true);
    
    // Обробка скролу для паралакс-ефекту без motion
    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollPercentage = 1 - Math.max(0, Math.min(1, rect.top / window.innerHeight));
        setScrollPosition(scrollPercentage);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Ініціальний виклик
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Перерозподіл зображень для вигляду зліва направо
  const columns = 3;
  const columnImages: string[][] = Array.from({ length: columns }, () => []);
  
  images.forEach((image, index) => {
    const columnIndex = index % columns;
    columnImages[columnIndex].push(image);
  });

  // Обробка всіх зображень як єдиного масиву для індексації при ховері
  const flattenedImages = images.map((src, index) => ({
    src,
    columnIndex: index % columns,
    withinColumnIndex: Math.floor(index / columns),
    globalIndex: index
  }));

  // Якщо ми не на клієнтській стороні, повертаємо заглушку
  if (!isClient) {
    return (
      <div className="w-full py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-full h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg mb-6"></div>
          ))}
        </div>
      </div>
    );
  }

  // Функція для обчислення зміщення для паралакс-ефекту
  const getTransform = (columnIndex: number, scrollPercentage: number) => {
    const transforms = [
      -300 * scrollPercentage, // перша колонка рухається вгору
      200 * scrollPercentage,  // друга колонка рухається вниз
      -400 * scrollPercentage  // третя колонка рухається вгору більше
    ];
    return transforms[columnIndex];
  };

  // Компонент для відображення зображення з фокусним ефектом
  const ImageItem = ({ 
    imageData,
    columnIndex 
  }: { 
    imageData: { 
      src: string, 
      globalIndex: number 
    }, 
    columnIndex: number
  }) => {
    const [isHorizontal, setIsHorizontal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const { src, globalIndex } = imageData;
    
    useEffect(() => {
      const img = new Image();
      img.onload = () => {
        setIsHorizontal(img.width > img.height);
        setIsLoaded(true);
      };
      img.src = src;
    }, [src]);

    const yOffset = getTransform(columnIndex, scrollPosition);

    return (
      <div 
        className="relative rounded-lg overflow-hidden mb-6 will-change-transform"
        style={{ transform: `translateY(${yOffset}px)` }}
        onMouseEnter={() => setHovered(globalIndex)}
        onMouseLeave={() => setHovered(null)}
      >
        {isLoaded ? (
          <div 
            className={cn(
              "w-full relative overflow-hidden rounded-lg transition-all duration-300",
              isHorizontal ? "h-[250px]" : "h-[350px]",
              hovered !== null && hovered !== globalIndex && "blur-sm scale-95 opacity-60"
            )}
          >
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
            <div
              className={cn(
                "absolute inset-0 flex items-end p-4 transition-all duration-300",
                hovered === globalIndex 
                  ? "bg-gradient-to-t from-black/70 via-black/40 to-transparent opacity-100" 
                  : "bg-black/20 opacity-0"
              )}
            >
              <span className="text-lg md:text-xl font-medium text-white">
                Фото {globalIndex + 1}
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full h-[300px] bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"></div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start max-w-5xl mx-auto gap-6 py-10 px-4"
      >
        {columnImages.map((column, colIndex) => (
          <div key={`column-${colIndex}`} className="grid">
            {column.map((image, imgIndex) => {
              const globalIndex = colIndex + imgIndex * columns;
              const imageData = flattenedImages.find(img => img.globalIndex === globalIndex);
              
              if (!imageData) return null;
              
              return (
                <ImageItem 
                  key={`img-${globalIndex}`} 
                  imageData={imageData}
                  columnIndex={colIndex}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}; 