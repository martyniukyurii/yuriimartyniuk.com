"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { 
  IconBrandReact, 
  IconBrandNodejs, 
  IconBrandTypescript, 
  IconDatabase, 
  IconBrandDocker,
  IconCoffee,
  IconMountain,
  IconCamera,
  IconBook,
  IconMusic,
  IconSchool,
  IconBriefcase,
  IconHeartHandshake,
  IconTrophy,
  IconBrandPython,
  IconBrandMongodb,
  IconCode,
  IconBrandFlutter,
  IconScissors,
  IconBike,
  IconChess
} from "@tabler/icons-react";
import { FlipWords } from "../ui/flip-words";
import Link from "next/link";
import { useSection, SectionType } from "../section-provider";
import { Link as HeroLink } from "@heroui/link";
import { HobbyModel } from "../3d/HobbyModel";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Додаємо оголошення типу для window
declare global {
  interface Window {
    handleSectionChange: (section: string) => void;
  }
}

export function AboutSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const totalImages = 5;
  const { setActiveSection } = useSection();
  const { t, language } = useTranslation();
  
  // Слова для фліп-компонента
  const flipWords = language === 'uk' ? [
    "Юрій Мартинюк",
    "fullstack розробник",
    "python інженер",
    "",
    "",
    "просто чіловий хлопець",
    "громадський активіст"
  ] : [
    "Yurii Martyniuk",
    "fullstack developer",
    "python engineer",
    "",
    "",
    "just chill guy",
    "community activist"
  ];
  
  // Зміна фото з інтервалом
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Функція для переходу на інші секції
  const handleSectionChange = (section: SectionType) => {
    console.log("Changing section to:", section);
    setActiveSection(section);
    window.location.hash = section;
  };
  
  // Додаємо функцію до window для використання в HTML
  useEffect(() => {
    // Експортуємо функцію до window для використання в HTML
    window.handleSectionChange = (section: string) => {
      console.log("Window changing section to:", section);
      setActiveSection(section as SectionType);
      window.location.hash = section;
    };
    
    // Прибираємо функцію при розмонтуванні компонента
    return () => {
      // Безпечний спосіб видалити властивість
      if (window.handleSectionChange) {
        window.handleSectionChange = undefined as any;
      }
    };
  }, [setActiveSection]);

  // Навички з рівнями володіння
  const skills = [
    { 
      name: t('about.skills.python.name'), 
      level: 98, 
      icon: <Image src="/tech_icons/python.svg" width={24} height={24} alt="Python" />,
      coffeeCount: 1247,
      projects: 21,
      description: t('about.skills.python.desc')
    },
    { 
      name: t('about.skills.react.name'), 
      level: 85, 
      icon: <Image src="/tech_icons/react.svg" width={24} height={24} alt="React" />,
      coffeeCount: 978,
      projects: 15,
      description: t('about.skills.react.desc')
    },
    { 
      name: t('about.skills.mongodb.name'), 
      level: 90, 
      icon: <Image src="/tech_icons/mongodb.svg" width={24} height={24} alt="MongoDB" />,
      coffeeCount: 865,
      projects: 18, 
      description: t('about.skills.mongodb.desc') 
    },
    { 
      name: t('about.skills.typescript.name'), 
      level: 82, 
      icon: <Image src="/tech_icons/typescript.svg" width={24} height={24} alt="TypeScript" />,
      coffeeCount: 712,
      projects: 14,
      description: t('about.skills.typescript.desc')
    },
    { 
      name: t('about.skills.devops.name'), 
      level: 70, 
      icon: <Image src="/tech_icons/docker.svg" width={24} height={24} alt="Docker" />,
      coffeeCount: 493,
      projects: 8,
      description: t('about.skills.devops.desc')
    },
    { 
      name: t('about.skills.flutter.name'), 
      level: 45, 
      icon: <Image src="/tech_icons/flutter.svg" width={24} height={24} alt="Flutter" />,
      coffeeCount: 186,
      projects: 2,
      description: t('about.skills.flutter.desc')
    },
  ];
  
  // Хобі
  const hobbies = [
    { 
      name: t('about.hobbies.origami.name'), 
      icon: <IconScissors size={28} />, 
      description: t('about.hobbies.origami.desc'),
      category: t('about.hobbies.origami.category'),
      modelPath: "/3D_models/origami_unicorn.glb"
    },
    { 
      name: t('about.hobbies.cycling.name'), 
      icon: <IconBike size={28} />, 
      description: t('about.hobbies.cycling.desc'), 
      category: t('about.hobbies.cycling.category'),
      modelPath: "/3D_models/bicycle.glb"
    },
    { 
      name: t('about.hobbies.programming.name'), 
      icon: <IconCode size={28} />, 
      description: t('about.hobbies.programming.desc'), 
      category: t('about.hobbies.programming.category'),
      modelPath: "/3D_models/macbook_laptop.glb"
    },
    { 
      name: t('about.hobbies.chess.name'), 
      icon: <IconChess size={28} />, 
      description: t('about.hobbies.chess.desc'), 
      category: t('about.hobbies.chess.category'),
      modelPath: "/3D_models/chess_piece_knight_horse.glb"
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-transparent to-blue-900/20">
      {/* Секція 1: Привітання + Фото */}
      <section className="min-h-screen flex flex-col md:flex-row items-center py-0 relative overflow-hidden">
        <div className="w-full md:w-1/2 mb-10 md:mb-0 flex flex-col justify-between items-center md:items-start px-4 md:px-10 z-10 h-full pt-20 md:pt-0 pb-10 md:pb-24">
          <div className="md:transform-none text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 tracking-tight" 
                dangerouslySetInnerHTML={{ 
                  __html: language === 'uk' 
                    ? 'Привіт,<br/>я Юрій Мартинюк' 
                    : 'Hello,<br/>I\'m Yurii Martyniuk' 
                }}
            />
            <div className="text-2xl md:text-4xl font-bold mb-6">
              <FlipWords 
                words={flipWords.slice(1)}
                useGradient={true}
                duration={2000}
              />
            </div>
          </div>
          
          <div className="w-full md:w-3/4 text-center md:text-left">
            <div className="w-16 h-px bg-blue-400 opacity-60 mb-6 mx-auto md:mx-0"></div>
            <p className="text-lg md:text-2xl text-gray-300 leading-relaxed">
              {t('about.introduction')}
            </p>
          </div>
        </div>
        
        <div className="w-full md:w-1/2 md:absolute md:right-0 md:top-0 md:bottom-0 h-[60vh] md:h-full">
          {[0, 1, 2, 3, 4].map((index) => (
            <div 
              key={index}
              className="absolute inset-0 transition-all duration-1000 ease-in-out transform h-full"
              style={{ 
                opacity: currentImageIndex === index ? 1 : 0,
                transform: currentImageIndex === index ? 'scale(1)' : 'scale(0.95)',
                zIndex: currentImageIndex === index ? 10 : 1,
                height: "100%"
              }}
            >
              <div className="h-full flex justify-center md:justify-end overflow-hidden relative">
                {/* Фонове зображення */}
                <div className="absolute bottom-0 z-0 flex justify-center w-full h-full">
                  <div className="relative w-full h-full">
                    <Image
                      src="/main_my_photos/image_background.png?v=1"
                      alt="Фон"
                      fill
                      className="object-contain object-bottom"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      style={{
                        scale: "1.25",
                        transform: "translateY(-15%) translateX(3%)"
                      }}
                      priority={index === 0}
                    />
                  </div>
                </div>
                {/* Основне фото */}
                <Image
                  src={`/main_my_photos/image${index + 1}.png?v=1`}
                  alt={`Юрій Мартинюк фото ${index + 1}`}
                  width={1000}
                  height={1500}
                  priority={index === 0}
                  className="z-10 relative h-full"
                  style={{
                    width: "auto",
                    objectFit: "contain",
                    objectPosition: "center bottom",
                    maxHeight: "100%",
                    marginBottom: "-15px"
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        
        {/* Градієнтне розмежування між секціями */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-blue-900/20 to-transparent"></div>
      </section>
      
      {/* Секція 2: Коротка інформація */}
      <section className="min-h-screen py-0 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto py-12 md:py-24 w-full">
          <h2 className="text-2xl md:text-4xl font-bold mb-6 md:mb-12 text-center">{t('about.description')}</h2>
          
          <div className="space-y-6 md:space-y-10">
            {/* Основна інформація */}
            <div className="text-sm md:text-lg text-gray-200 leading-relaxed space-y-3 md:space-y-4">
              <p>{t('about.description.1')}</p>
              <p>{t('about.description.2')}</p>
              <p dangerouslySetInnerHTML={{ __html: t('about.description.3') }} />
              <p dangerouslySetInnerHTML={{ __html: t('about.description.4') }} />
              <p>{t('about.description.5')}</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Секція 3: Навички */}
      <section className="min-h-screen py-0 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto py-16 md:py-24 w-full">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">{t('about.tech.stack')}</h2>
          
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {skills.map((skill) => (
              <div key={skill.name} className="bg-white/5 backdrop-blur-md p-5 md:p-6 rounded-xl hover:bg-white/10 transition-all duration-300">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-blue-400 p-2 bg-blue-400/10 rounded-lg">
                    {skill.icon}
                    </div>
                    <h3 className="text-xl md:text-2xl font-semibold">{skill.name}</h3>
                  </div>
                  
                  <div className="md:ml-auto flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm bg-blue-500/20 text-blue-300 py-1 px-2 rounded-lg">
                      <IconCoffee size={16} />
                      <span>{skill.coffeeCount} {t('about.coffee.cups')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm bg-blue-500/20 text-blue-300 py-1 px-2 rounded-lg">
                      <IconCode size={16} />
                      <span>{skill.projects} {t('about.projects.count')}</span>
                    </div>
              </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-3 bg-gray-700 rounded-full overflow-hidden flex-grow">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
                    <div className="text-right text-sm font-medium text-blue-300 whitespace-nowrap">
                  {skill.level}%
                    </div>
                  </div>
                </div>
                
                <p className="mt-3 text-gray-300 text-sm md:text-base">
                  {skill.description}
                </p>
              </div>
            ))}
              </div>
            </div>
      </section>
            
            {/* Досвід роботи */}
      <section className="py-2 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <IconBriefcase size={24} className="text-blue-400" />
                <h3 className="text-lg md:text-2xl font-semibold">{t('about.professional.experience')}</h3>
              </div>
          
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 space-y-4 md:space-y-6">
                {/* УкрГазБанк */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <Image
                        src="/logos_job/logo_ugb.jpg"
                        width={40}
                        height={40}
                        alt="Логотип УкрГазБанк"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium">{t('about.ugb.role')}</h4>
                      <p className="text-sm font-medium text-blue-400">{t('about.ugb.company')}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">{t('about.ugb.duration')}</p>
                      <ul className="list-disc list-inside text-sm text-gray-300 mt-2 md:mt-3 space-y-1.5">
                        <li>{t('about.ugb.responsibilities.1')}</li>
                        <li>{t('about.ugb.responsibilities.2')}</li>
                        <li>{t('about.ugb.responsibilities.3')}</li>
                      </ul>
                      <p className="mt-2">
                        <HeroLink isExternal showAnchorIcon href="https://www.ukrgasbank.com/" className="text-blue-400 text-sm">
                          {t('about.more.about')} ukrgasbank.com
                        </HeroLink>
                      </p>
                    </div>
                  </div>
                </div>

                {/* MediaMood */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <Image
                        src="/logos_job/logo_mediamood.png"
                        width={40}
                        height={40}
                        alt="Логотип MediaMood"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium">{t('about.mediamood.role')}</h4>
                      <p className="text-sm font-medium text-blue-400">{t('about.mediamood.company')}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">{t('about.mediamood.duration')}</p>
                      <ul className="list-disc list-inside text-sm text-gray-300 mt-2 md:mt-3 space-y-1.5">
                        <li>{t('about.mediamood.responsibilities.1')}</li>
                        <li>{t('about.mediamood.responsibilities.2')}</li>
                        <li>{t('about.mediamood.responsibilities.3')}</li>
                        <li>{t('about.mediamood.responsibilities.4')}</li>
                        <li>{t('about.mediamood.responsibilities.5')}</li>
                      </ul>
                      <p className="mt-2">
                        <HeroLink isExternal showAnchorIcon href="https://mediamood.today" className="text-blue-400 text-sm">
                          {t('about.more.about')} mediamood.today
                        </HeroLink>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mindex */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                      M
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium">{t('about.mindex.role')}</h4>
                      <p className="text-sm font-medium text-blue-400">{t('about.mindex.company')}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">{t('about.mindex.duration')}</p>
                      <ul className="list-disc list-inside text-sm text-gray-300 mt-2 md:mt-3 space-y-1.5">
                        <li>{t('about.mindex.responsibilities.1')}</li>
                        <li>{t('about.mindex.responsibilities.2')}</li>
                        <li>{t('about.mindex.responsibilities.3')}</li>
                        <li>{t('about.mindex.responsibilities.4')}</li>
                      </ul>
                      <p className="mt-2">
                        <HeroLink isExternal showAnchorIcon href="https://mindex.it.com" className="text-blue-400 text-sm">
                          {t('about.more.about')} mindex.it.com
                        </HeroLink>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vishunka */}
                <div>
                  <div className="flex items-start gap-3">
                    <div className="mt-1 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                      <Image
                        src="/logos_job/logo_vishunka.png"
                        width={40}
                        height={40}
                        alt="Логотип Vishunka"
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <div>
                      <h4 className="text-base md:text-lg font-medium">{t('about.vishunka.role')}</h4>
                      <p className="text-sm font-medium text-blue-400">{t('about.vishunka.company')}</p>
                      <p className="text-xs md:text-sm text-gray-400 mt-1">{t('about.vishunka.duration')}</p>
                      <ul className="list-disc list-inside text-sm text-gray-300 mt-2 md:mt-3 space-y-1.5">
                        <li>{t('about.vishunka.responsibilities.1')}</li>
                        <li>{t('about.vishunka.responsibilities.2')}</li>
                        <li>{t('about.vishunka.responsibilities.3')}</li>
                        <li>{t('about.vishunka.responsibilities.4')}</li>
                      </ul>
                      <p className="mt-2">
                        <HeroLink isExternal showAnchorIcon href="https://vishunka.com" className="text-blue-400 text-sm">
                          {t('about.more.about')} vishunka.com
                        </HeroLink>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </section>
            
            {/* Волонтерство */}
      <section className="py-2 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <IconHeartHandshake size={24} className="text-blue-400" />
                <h3 className="text-lg md:text-2xl font-semibold">{t('about.volunteering')}</h3>
              </div>
          
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                    <Image
                      src="/logos_job/logo_fsymvoly.jpeg"
                      width={40}
                      height={40}
                      alt="Логотип Фонд Символи"
                      className="object-contain w-full h-full"
                    />
                  </div>
                  <div>
                    <h4 className="text-base md:text-lg font-medium">{t('about.fsymvoly.role')}</h4>
                    <p className="text-sm font-medium text-blue-400">{t('about.fsymvoly.company')}</p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">{t('about.fsymvoly.duration')}</p>
                    <ul className="list-disc list-inside text-sm text-gray-300 mt-2 md:mt-3 space-y-1.5">
                      <li>{t('about.fsymvoly.responsibilities.1')}</li>
                      <li>{t('about.fsymvoly.responsibilities.2')}</li>
                      <li>{t('about.fsymvoly.responsibilities.3')}</li>
                      <li>{t('about.fsymvoly.responsibilities.4')}</li>
                    </ul>
                    <p className="mt-2">
                      <HeroLink isExternal showAnchorIcon href="https://fsymvoly.org" className="text-blue-400 text-sm">
                        {t('about.more.about')} fsymvoly.org
                      </HeroLink>
                    </p>
                  </div>
                </div>
              </div>
            </div>
      </section>
            
            {/* Досягнення */}
      <section className="py-2 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <IconTrophy size={24} className="text-blue-400" />
                <h3 className="text-lg md:text-2xl font-semibold">{t('about.achievements')}</h3>
              </div>
          
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5">
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1 md:space-y-2">
                  <li>{t('about.achievements.ibm')}</li>
                  <li>
                    {t('about.achievements.vishunka.rotary')}
                    {' '}
                    <Link href="https://vishunka.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Vishunka</Link>
                    {' '}
                    {t('about.present').includes('Теперішній') ? 'на' : 'at'}
                    {' '}
                    <Link href="https://lpnu.ua/news/lvivski-politekhniky-z-rd-tsentru-doluchylysia-do-rotariiskoho-dilovoho-forumu-innovatsii" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {t('about.present').includes('Теперішній') ? 'Ротарійському діловому форумі інновацій' : 'Rotary Business Innovation Forum'}
                    </Link>
                  </li>
                  <li>
                    {t('about.achievements.vishunka.startup2023')}
                    {' '}
                    <Link href="https://vishunka.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Vishunka</Link>
                    {' '}
                    {t('about.present').includes('Теперішній') ? 'у конкурсі' : 'in the'}
                    {' '}
                    <Link href="https://www.instagram.com/tech_startup_school/p/C1JioXjuDwM/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                      {t('about.present').includes('Теперішній') ? 'STARTUP ПРОРИВ 2023' : 'STARTUP BREAKTHROUGH 2023'}
                    </Link>
                  </li>
                  <li>
                    {t('about.achievements.aiddot.hackathon')}
                    {' '}
                    AID.DOT
                    {' '}
                    {t('about.present').includes('Теперішній') ? 'на хакатоні' : 'at the'}
                    {' '}
                    <Link href="https://ain.ua/2024/11/21/yak-proisov-studentskii-xakaton-hack4innovation/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Hack4Innovation</Link>
                  </li>
                  <li>
                    {t('about.achievements.mindex.accelerator')}
                    {' '}
                    <Link href="https://mindex.it.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Mindex</Link>
                    {' '}
                    {t('about.present').includes('Теперішній') ? 'відібраний на акселераційну програму' : 'selected for the'}
                    {' '}
                    <Link href="https://www.opendatatech.org/accelerator" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">OpenDataAccelerator</Link>
                  </li>
                  <li>
                    {t('about.achievements.mindex.hackathon')}
                    {' '}
                    <Link href="https://mindex.it.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Mindex</Link>
                    {' '}
                    {t('about.present').includes('Теперішній') ? 'на хакатоні' : 'at the'}
                    {' '}
                    <Link href="https://city.cv.ua/press-center/novyny/u-chernivtsyakh-13-grudnya-vidbuvsya-khakaton-vidkritikh-danikh-14625#1" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">ChernivtsiOpenDataHackathon</Link>
                  </li>
                </ul>
          </div>
        </div>
      </section>
      
      {/* Освіта */}
      <section className="py-2 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <IconSchool size={24} className="text-blue-400" />
            <h3 className="text-lg md:text-2xl font-semibold">{t('about.education')}</h3>
          </div>
          
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 md:p-5 space-y-3 md:space-y-4">
            <div>
              <h4 className="text-base md:text-lg font-medium">
                <HeroLink isExternal showAnchorIcon href="https://www.chnu.edu.ua/" className="hover:text-blue-400">
                  {t('about.education.chnu')}
                </HeroLink>
              </h4>
              <p className="text-sm text-gray-300">{t('about.education.chnu.period')}</p>
                    </div>
            <div>
              <h4 className="text-base md:text-lg font-medium">
                <HeroLink isExternal showAnchorIcon href="https://polytech.cv.ua/" className="hover:text-blue-400">
                  {t('about.education.polytech')}
                </HeroLink>
              </h4>
              <p className="text-sm text-gray-300">{t('about.education.polytech.period')}</p>
                  </div>
            <div>
              <h4 className="text-base md:text-lg font-medium">
                <HeroLink isExternal showAnchorIcon href="https://lyceum16.cv.ua/" className="hover:text-blue-400">
                  {t('about.education.school')}
                </HeroLink>
              </h4>
              <p className="text-sm text-gray-300">{t('about.education.school.period')}</p>
              </div>
          </div>
        </div>
      </section>
      
      {/* Секція 4: Хобі */}
      <section className="min-h-screen py-0 px-4 md:px-10 backdrop-blur-lg flex items-center">
        <div className="max-w-5xl mx-auto py-16 md:py-24 w-full">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 md:mb-12 text-center">{t('about.outside.work')}</h2>
          
          <div className="mb-10 md:mb-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 md:p-8 rounded-xl text-center">
            <p className="text-lg md:text-xl italic text-gray-200 md:leading-relaxed">
              {t('about.hobby.quote')}
            </p>
            <p className="mt-4 md:mt-6 text-sm text-blue-300">
              {t('about.hobby.quote.author')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
            {hobbies.map((hobby) => (
              <HobbyModel
                key={hobby.name} 
                hobbyName={hobby.name}
                description={hobby.description}
                category={hobby.category}
                modelPath={hobby.modelPath}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
} 