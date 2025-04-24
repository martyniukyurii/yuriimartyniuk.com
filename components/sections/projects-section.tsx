"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { IconCode, IconExternalLink, IconBrandGithub } from "@tabler/icons-react";
import Image from "next/image";
import "../../styles/projects.css";
import { Tooltip } from "@heroui/react";

import { useTranslation } from "@/lib/hooks/useTranslation";

export function ProjectsSection() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const projectRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const { t } = useTranslation();

  // Масив кольорів для градієнтів (світла тема)
  const lightThemeColors = [
    ['rgba(16, 185, 129, 0.25)', 'rgba(45, 212, 191, 0.15)'], // Зелений
    ['rgba(225, 29, 72, 0.2)', 'rgba(248, 113, 113, 0.15)'],  // Червоний
    ['rgba(79, 70, 229, 0.2)', 'rgba(165, 180, 252, 0.15)'],  // Синій
    ['rgba(245, 158, 11, 0.2)', 'rgba(252, 211, 77, 0.15)'],  // Жовтий
    ['rgba(217, 70, 239, 0.2)', 'rgba(232, 121, 249, 0.15)'], // Пурпуровий
    ['rgba(14, 165, 233, 0.2)', 'rgba(56, 189, 248, 0.15)'],  // Блакитний
    ['rgba(168, 85, 247, 0.2)', 'rgba(192, 132, 252, 0.15)'], // Фіолетовий
    ['rgba(249, 115, 22, 0.2)', 'rgba(251, 146, 60, 0.15)'],  // Оранжевий
  ];

  // Масив кольорів для градієнтів (темна тема)
  const darkThemeColors = [
    ['rgba(16, 185, 129, 0.5)', 'rgba(45, 212, 191, 0.3)'],   // Зелений
    ['rgba(225, 29, 72, 0.4)', 'rgba(248, 113, 113, 0.3)'],   // Червоний
    ['rgba(79, 70, 229, 0.4)', 'rgba(165, 180, 252, 0.3)'],   // Синій
    ['rgba(245, 158, 11, 0.4)', 'rgba(252, 211, 77, 0.3)'],   // Жовтий
    ['rgba(217, 70, 239, 0.4)', 'rgba(232, 121, 249, 0.3)'],  // Пурпуровий
    ['rgba(14, 165, 233, 0.4)', 'rgba(56, 189, 248, 0.3)'],   // Блакитний
    ['rgba(168, 85, 247, 0.4)', 'rgba(192, 132, 252, 0.3)'],  // Фіолетовий
    ['rgba(249, 115, 22, 0.4)', 'rgba(251, 146, 60, 0.3)'],   // Оранжевий
  ];

  // Оптимізована функція для обробки руху миші
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      projectRefs.current.forEach((card) => {
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const isHovering = 
          e.clientX > rect.left &&
          e.clientX < rect.right &&
          e.clientY > rect.top &&
          e.clientY < rect.bottom;

        card.style.setProperty('--glow-x', `${x}px`);
        card.style.setProperty('--glow-y', `${y}px`);
        card.style.setProperty('--glow-opacity', isHovering ? '1' : '0');
      });
    });
  }, []);

  // Функція для зберігання посилань на картки
  const setProjectRef = useCallback((el: HTMLDivElement | null, index: number) => {
    projectRefs.current[index] = el;
  }, []);

  useEffect(() => {
    // Перевіряємо, чи зараз активна темна тема
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark');

      setIsDarkMode(isDark);
    };

    // Початкова перевірка
    checkDarkMode();

    // Налаштовуємо спостерігач за змінами класу
    const observer = new MutationObserver(checkDarkMode);

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Додаємо відстеження позиції миші для ефекту світіння
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      observer.disconnect();
      document.removeEventListener('mousemove', handleMouseMove);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [handleMouseMove]);

  // Функція для отримання CSS градієнта для картки
  const getGradientStyle = (index: number) => {
    const colors = isDarkMode ? darkThemeColors : lightThemeColors;
    const colorPair = colors[index % colors.length];
    
    return {
      '--glow-color': `radial-gradient(circle at var(--glow-x) var(--glow-y), ${colorPair[0]}, ${colorPair[1]}, transparent 70%)`,
      '--glow-x': '50%',
      '--glow-y': '50%',
      '--glow-opacity': '0',
    } as React.CSSProperties;
  };

  // Функція для перевірки, чи є посилання дійсним URL
  const isValidUrl = (url: string) => {
    return url && url !== "#";
  };

  const projects = [
    {
      id: 1,
      title: t('projects.portfolio.title'),
      description: t('projects.portfolio.description'),
      image: "/project_images/my_portfolio_next.js.png",
      isMobile: false,
      customSize: false,
      technologies: ["Next.js", "TypeScript", "TailwindCSS", "React", "Three.js"],
      githubUrl: "https://github.com/martyniukyurii/yuriimartyniuk.com",
      liveUrl: "https://yuriimartyniuk.com"
    },
    {
      id: 2,
      title: t('projects.kovcheg.title'),
      description: t('projects.kovcheg.description'),
      image: "/project_images/vashkovcheg_next.js.png",
      isMobile: false,
      customSize: false,
      technologies: ["Next.js", "React", "TailwindCSS", "Python", "FastAPI", "MongoDB"],
      githubUrl: "https://github.com/martyniukyurii/KovchegFrontend",
      liveUrl: "https://vashkovcheg.cv.ua"
    },
    {
      id: 3,
      title: t('projects.mediamood.title'),
      description: t('projects.mediamood.description'),
      image: "/project_images/mediamood_next.js.png",
      isMobile: false,
      customSize: false,
      technologies: ["Next.js", "React", "Python", "API Integration", "PyTorch", "NLP"],
      githubUrl: "#",
      liveUrl: "mediamood.today"
    },
    {
      id: 4,
      title: t('projects.mindex.title'),
      description: t('projects.mindex.description'),
      image: "/project_images/mindex_next.js.png",
      isMobile: false,
      customSize: false,
      technologies: ["Next.js", "React", "Python", "FastAPI", "MongoDB", "PyTorch", "NLP"],
      githubUrl: "#",
      liveUrl: "https://mindex.it.com"
    },
    {
      id: 5,
      title: t('projects.fsymvoly.title'),
      description: t('projects.fsymvoly.description'),
      image: "/project_images/fsymvoly_html_css_js.png",
      isMobile: false,
      customSize: false,
      technologies: ["HTML", "CSS", "JavaScript"],
      githubUrl: "https://github.com/martyniukyurii/fsymvoly.org",
      liveUrl: "https://fsymvoly.org/"
    },
    {
      id: 6,
      title: t('projects.mazermodels.title'),
      description: t('projects.mazermodels.description'),
      image: "/project_images/mazer_model_telegrambot_python.png",
      isMobile: false,
      customSize: true,
      technologies: ["Python", "Telegram Bot API"],
      githubUrl: "https://github.com/martyniukyurii/MAZER_MODELS",
      liveUrl: "https://t.me/mazermodels_bot"
    },
    {
      id: 7,
      title: t('projects.decoder.title'),
      description: t('projects.decoder.description'),
      image: "/project_images/decoder_flutter.jpg",
      isMobile: true,
      customSize: false,
      technologies: ["Flutter", "Dart", "Matrix"],
      githubUrl: "#",
      liveUrl: "#"
    },
    {
      id: 8,
      title: t('projects.vishunka.title'),
      description: t('projects.vishunka.description'),
      image: "/project_images/vishunka_flutter.jpg",
      isMobile: true,
      customSize: false,
      technologies: ["Flutter", "Firebase", "API Integration"],
      githubUrl: "#",
      liveUrl: "#"
    }
  ];

  return (
    <section className="min-h-screen flex items-center justify-center" id="projects">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center mb-12">
          <IconCode className="w-8 h-8 mr-2 text-emerald-500 dark:text-emerald-400" />
          <h2 className="text-4xl font-bold">{t('projects.title')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div 
              key={project.id} 
              ref={(el) => setProjectRef(el, index)}
              className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-lg overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 flex flex-col h-full relative glow-card"
              style={getGradientStyle(index)}
            >
              <div className="glow-effect absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none" />
              
              <div className={`overflow-hidden ${project.isMobile ? 'flex justify-center items-center py-4 h-56' : 'h-48 relative'}`}>
                {project.isMobile ? (
                  <div className="h-full max-h-48 relative" style={{ width: '35%' }}>
                    <Image 
                      fill 
                      alt={project.title}
                      className="rounded"
                      src={project.image}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                ) : project.customSize ? (
                  <div className="w-full h-full relative flex items-center justify-center">
                    <div className="relative" style={{ width: '120%', height: '120%' }}>
                      <Image 
                        fill 
                        alt={project.title}
                        className="transform transition-transform duration-500 hover:scale-105"
                        src={project.image}
                        style={{ objectFit: 'contain' }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full relative">
                    <Image 
                      fill 
                      alt={project.title}
                      className="transform transition-transform duration-500 hover:scale-105"
                      src={project.image}
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-grow">
                <h3 className="text-xl font-bold mb-2 dark:text-white">{project.title}</h3>
                <p 
                  className="mb-4 text-slate-800 project-description" 
                  style={{ color: isDarkMode ? 'white' : '' }}
                >
                  {project.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.technologies.map((tech) => (
                    <span 
                      key={tech} 
                      className="px-2 py-1 bg-emerald-500/20 text-emerald-700 text-xs rounded-md project-tech-badge"
                      style={{ 
                        backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.4)' : '',
                        color: isDarkMode ? 'white' : '' 
                      }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mt-auto">
                  {isValidUrl(project.githubUrl) ? (
                    <a 
                      className="flex items-center transition-colors duration-300 text-gray-600 hover:text-black project-link" 
                      href={project.githubUrl}
                      rel="noopener noreferrer"
                      style={{ color: isDarkMode ? 'white' : '' }}
                      target="_blank"
                    >
                      <IconBrandGithub className="w-5 h-5 mr-1" />
                      <span>{t('projects.code')}</span>
                    </a>
                  ) : (
                    <Tooltip 
                      className="text-xs"
                      color="danger"
                      content={t('projects.code.private')}
                    >
                      <span className="flex items-center text-gray-400 cursor-not-allowed project-link-disabled">
                        <IconBrandGithub className="w-5 h-5 mr-1 text-rose-500" />
                        <span className="text-rose-500">{t('projects.code')}</span>
                      </span>
                    </Tooltip>
                  )}
                  
                  {isValidUrl(project.liveUrl) ? (
                    <a 
                      className="flex items-center transition-colors duration-300 text-gray-600 hover:text-black project-link" 
                      href={project.liveUrl}
                      rel="noopener noreferrer"
                      style={{ color: isDarkMode ? 'white' : '' }}
                      target="_blank"
                    >
                      <IconExternalLink className="w-5 h-5 mr-1" />
                      <span>{t('projects.demo')}</span>
                    </a>
                  ) : (
                    <Tooltip 
                      className="text-xs"
                      color="warning"
                      content={t('projects.demo.unavailable')}
                    >
                      <span className="flex items-center text-gray-400 cursor-not-allowed project-link-disabled">
                        <IconExternalLink className="w-5 h-5 mr-1 text-yellow-500" />
                        <span className="text-yellow-500">{t('projects.demo')}</span>
                      </span>
                    </Tooltip>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <a 
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-md transition-colors duration-300" 
            href="https://github.com/martyniukyurii"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('projects.view.more')}
          </a>
        </div>
      </div>

      <style>{`
        .glow-card:hover::before,
        .glow-card:hover::after {
          opacity: 1;
        }
      `}</style>
    </section>
  );
} 