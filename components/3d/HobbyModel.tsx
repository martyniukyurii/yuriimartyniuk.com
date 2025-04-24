"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { IconScissors, IconBike, IconCode, IconChess } from "@tabler/icons-react";
import { useTheme } from "next-themes";

import { MODEL_RESET_EVENT } from "../section-provider"; // Імпортуємо константу події

import SimplifiedModelViewer from "./SimplifiedModelViewer";

interface HobbyModelProps {
  hobbyName: string;
  description: string;
  category: string;
  modelPath: string;
}

// Карта для іконок фолбеку
const fallbackIcons: Record<string, React.ReactNode> = {
  "Орігамі": <IconScissors className="text-blue-400" size={60} />,
  "Велоспорт": <IconBike className="text-blue-400" size={60} />,
  "Програмування": <IconCode className="text-blue-400" size={60} />,
  "Шахи": <IconChess className="text-blue-400" size={60} />,
};

// Спеціальні налаштування для кожної моделі - fitOffset визначає відстань камери
const modelSettings: Record<string, {
  fitOffset: number,
  autoRotate: boolean
}> = {
  "Орігамі": {
    fitOffset: 1.4, 
    autoRotate: true
  },
  "Велоспорт": {
    fitOffset: 1.2,
    autoRotate: true
  },
  "Програмування": {
    fitOffset: 1.3,
    autoRotate: true
  },
  "Шахи": {
    fitOffset: 1.5,
    autoRotate: true
  }
};

// Спеціальні налаштування для фону кожної моделі
const backgroundSettings: Record<string, {
  normal: string,
  hover: string
}> = {
  "Орігамі": {
    normal: "from-blue-500/10 to-purple-500/10",
    hover: "from-blue-600/30 to-purple-600/30"
  },
  "Велоспорт": {
    normal: "from-green-500/10 to-blue-500/10",
    hover: "from-green-600/30 to-blue-600/30"
  },
  "Програмування": {
    normal: "from-indigo-500/10 to-blue-500/10",
    hover: "from-indigo-600/30 to-blue-600/30"
  },
  "Шахи": {
    normal: "from-gray-500/10 to-purple-500/10",
    hover: "from-gray-600/30 to-purple-600/30"
  }
};

// Світлові ефекти для карток при наведенні
const glowEffects: Record<string, string> = {
  "Орігамі": "shadow-blue-400/30",
  "Велоспорт": "shadow-green-400/30",
  "Програмування": "shadow-indigo-400/30",
  "Шахи": "shadow-purple-400/30"
};

export function HobbyModel({ hobbyName, description, category, modelPath }: HobbyModelProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [modelError, setModelError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fullPath, setFullPath] = useState<string>(modelPath);
  const [isMounted, setIsMounted] = useState(false);
  const [visibilityKey, setVisibilityKey] = useState(Date.now()); // Ключ для перезавантаження при зміні видимості
  const [needsReset, setNeedsReset] = useState(false); // Прапорець для контролю оновлення
  const modelViewerRef = useRef<HTMLDivElement>(null);
  const { theme, resolvedTheme } = useTheme();

  // Вирішуємо проблему гідратації, спочатку рендеримо на сервері з нейтральними значеннями,
  // а потім оновлюємо після монтування компонента
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Відстежуємо видимість компонента для перезавантаження моделі
  useEffect(() => {
    // Створюємо IntersectionObserver для перевірки, чи компонент видимий
    if (typeof window !== 'undefined' && modelViewerRef.current) {
      const observer = new IntersectionObserver(
        (entries) => {
          // Якщо компонент став видимий
          entries.forEach(entry => {
            if (entry.isIntersecting && modelError) {
              // Перезавантажуємо модель, змінюючи ключ, тільки якщо була помилка
              setVisibilityKey(Date.now());
            }
          });
        },
        { threshold: 0.1 } // Спрацьовує, коли 10% компонента відображається
      );

      observer.observe(modelViewerRef.current);

      return () => {
        observer.disconnect();
      };
    }
  }, [modelError]);

  // Визначаємо тему лише на клієнті після монтування компонента
  const isDarkTheme = isMounted && (theme === 'dark' || resolvedTheme === 'dark');

  // Відстежуємо завантаження моделі за допомогою useEffect
  useEffect(() => {
    // Скидаємо стан при зміні шляху до моделі
    setIsLoading(true);
    setModelError(false);
    
    // Переконуємося, що шлях до моделі правильний
    const completePath = modelPath.startsWith('/') || modelPath.startsWith('http') 
      ? modelPath 
      : `/3D_models/${modelPath}`;
    
    // Зберігаємо повний шлях
    setFullPath(completePath);
    
    // Функція для перевірки доступності моделі
    const checkModelAvailability = async () => {
      try {
        const response = await fetch(completePath, { method: 'HEAD' });

        if (!response.ok) {
          throw new Error(`Model not found: ${completePath}`);
        }
        
        // Встановлюємо таймаут, щоб дати моделі час на завантаження
        const loadingTimeout = setTimeout(() => {
          setIsLoading(false);
        }, 1500);
        
        return () => clearTimeout(loadingTimeout);
      } catch (error) {
        console.error(`Failed to load model: ${completePath}`, error);
    setModelError(true);
    setIsLoading(false);
      }
  };
    
    checkModelAvailability();
  }, [modelPath]);

  // Обробник події оновлення моделей
  useEffect(() => {
    const handleModelReset = () => {
      // Встановлюємо прапорець, що модель потребує перезавантаження
      setNeedsReset(true);
    };
    
    window.addEventListener(MODEL_RESET_EVENT, handleModelReset);
    
    return () => {
      window.removeEventListener(MODEL_RESET_EVENT, handleModelReset);
    };
  }, []);
  
  // Окремий ефект для перезавантаження моделі, коли потрібно
  useEffect(() => {
    if (needsReset) {
      console.log(`Resetting 3D model: ${hobbyName}`);
      setVisibilityKey(Date.now());
      setIsLoading(true);
      setModelError(false);
      setNeedsReset(false); // Скидаємо прапорець
    }
  }, [needsReset, hobbyName]);

  // Отримуємо налаштування для конкретної моделі або використовуємо значення за замовчуванням
  const settings = modelSettings[hobbyName] || {
    fitOffset: 1.2,
    autoRotate: true
  };

  // Отримуємо налаштування фону та світлових ефектів
  const bgSettings = backgroundSettings[hobbyName] || {
    normal: "from-blue-500/10 to-purple-500/10",
    hover: "from-blue-600/30 to-purple-600/30"
  };
  
  const glowEffect = glowEffects[hobbyName] || "shadow-blue-400/30";

  // Фіксовані базові класи для початкового рендеру (і для сервера)
  const baseTagClass = "text-xs px-2 py-0.5 rounded-full transition-colors duration-300";
  const baseDescClass = "text-sm md:text-base transition-colors duration-300";

  // Динамічні класи, що залежать від теми, застосовуються тільки на клієнті
  const getTagClass = () => {
    if (!isMounted) return `${baseTagClass} bg-blue-500/30 text-blue-300`; // Базове значення для SSR
    
    return `${baseTagClass} ${isHovered 
      ? (isDarkTheme ? 'bg-blue-500/50 text-blue-100' : 'bg-blue-500/70 text-white')
      : (isDarkTheme ? 'bg-blue-500/30 text-blue-300' : 'bg-blue-500/40 text-blue-800')
    }`;
  };
  
  const getDescriptionClass = () => {
    if (!isMounted) return `${baseDescClass} text-gray-300`; // Базове значення для SSR
    
    return `${baseDescClass} ${isHovered
      ? (isDarkTheme ? 'text-gray-100' : 'text-gray-800')
      : (isDarkTheme ? 'text-gray-300' : 'text-gray-600')
    }`;
  };
  
  const getTitleClass = () => {
    const baseClass = "text-xl md:text-2xl font-semibold transition-colors duration-300";

    if (!isMounted) return baseClass; // Базове значення для SSR
    
    return `${baseClass} ${isHovered 
      ? (isDarkTheme ? 'text-white' : 'text-gray-900')
      : ''
    }`;
  };

  return (
    <motion.div 
      className={`relative bg-white/5 backdrop-blur-md rounded-xl p-5 md:p-6 
        transition-all duration-500 ease-out
        ${isHovered ? 'bg-white/15 shadow-xl ' + glowEffect : 'hover:bg-white/10 shadow-md'}
      `}
      whileHover={{ 
        y: -5,
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 15 }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ефект світіння/вспишки при наведенні */}
      <motion.div 
        animate={{
          opacity: isHovered ? 0.4 : 0,
          scale: isHovered ? 1.05 : 1
        }}
        className="absolute inset-0 -z-10 rounded-xl opacity-0 glow-effect"
        style={{
          background: `radial-gradient(circle at center, var(--glow-color) 0%, transparent 70%)`,
          filter: 'blur(20px)',
          '--glow-color': hobbyName === "Орігамі" ? 'rgba(96, 165, 250, 0.4)' : 
                       hobbyName === "Велоспорт" ? 'rgba(74, 222, 128, 0.4)' :
                       hobbyName === "Програмування" ? 'rgba(99, 102, 241, 0.4)' :
                       'rgba(168, 85, 247, 0.4)'
        } as any}
        transition={{ duration: 0.3 }}
      />

      <div className="flex flex-col items-center text-center">
        {/* Збільшуємо область для 3D моделі */}
        <motion.div 
          ref={modelViewerRef}
          className={`w-full h-52 md:h-64 rounded-lg bg-gradient-to-b ${isHovered ? bgSettings.hover : bgSettings.normal} mb-4 md:mb-5 overflow-hidden relative`}
          transition={{ duration: 0.3 }}
        >
          {isLoading && !modelError && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-400" />
            </div>
          )}
          
          {!modelError ? (
            <div className="w-full h-full">
              <SimplifiedModelViewer 
                key={visibilityKey}
                autoRotate={true}
                backgroundColor="transparent"
                className="w-full h-full"
                fitOffset={settings.fitOffset}
                modelPath={fullPath}
              />
            </div>
          ) : (
            // Фолбек на випадок помилки з 3D моделлю
            <div className="text-blue-400 flex items-center justify-center w-full h-full bg-blue-500/20 rounded-lg">
              {fallbackIcons[hobbyName] || <IconCode size={60} />}
            </div>
          )}
        </motion.div>
        
        <motion.div 
          animate={{ 
            scale: isHovered ? 1.05 : 1
          }}
          className="flex items-center gap-2 mb-2 md:mb-3"
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <h3 className={getTitleClass()}>
            {hobbyName}
          </h3>
          <motion.span className={getTagClass()}>
            {category}
          </motion.span>
        </motion.div>
        
        <motion.p className={getDescriptionClass()}>
          {description}
        </motion.p>
      </div>
    </motion.div>
  );
} 