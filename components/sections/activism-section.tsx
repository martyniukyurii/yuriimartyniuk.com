"use client";

import React, { useState, useEffect } from "react";
import { 
  IconHeartHandshake, 
  IconChevronRight,
  IconBrandYoutube,
  IconBrandFacebook,
  IconX
} from "@tabler/icons-react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  useDisclosure,
} from "@heroui/react";
import '@/styles/activism.css';
import { ParallaxScrollFocusSimple } from "@/components/ui/parallax-scroll-focus-simple";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { TranslationKey } from "@/lib/translations";

// Категорії активізму
const CATEGORIES = {
  VOLUNTEERING: 'activism.categories.volunteering' as TranslationKey,
  TRAINING: 'activism.categories.trainings' as TranslationKey,
  MEDIA: 'activism.categories.media' as TranslationKey
};

// Фіксовані кількості для категорій
const CATEGORY_COUNTS = {
  [CATEGORIES.VOLUNTEERING]: 18,
  [CATEGORIES.TRAINING]: 50,
  [CATEGORIES.MEDIA]: 7
};

// Зображення для галереї
const galleryImages = Array.from({ length: 25 }, (_, i) => `/activism_gallery/image${i + 1}.jpg`);

// Медіа посилання
const mediaLinks = [
  {
    url: "https://www.youtube.com/watch?v=3KKHjHKvIXk&ab_channel=%D0%9F%D0%BE%D0%B4%D1%80%D0%BE%D0%B1%D0%B8%D1%86%D1%96",
    title: 'activism.media.podrobytsi' as TranslationKey,
    type: "youtube"
  },
  {
    url: "https://www.youtube.com/watch?v=Z3ZmFEds46s&ab_channel=%D0%A7%D0%B5%D1%80%D0%BD%D1%96%D0%B2%D0%B5%D1%86%D1%8C%D0%BA%D0%B8%D0%B9%D0%9F%D1%80%D0%BE%D0%BC%D1%96%D0%BD%D1%8C",
    title: 'activism.media.chpromin.broadcast' as TranslationKey,
    type: "youtube"
  },
  {
    url: "https://www.facebook.com/share/p/196ShcYXch/",
    title: 'activism.media.facebook.post' as TranslationKey,
    type: "facebook"
  },
  {
    url: "https://www.youtube.com/watch?v=V9mgEpPKe9s&ab_channel=%D0%A7%D0%B5%D1%80%D0%BD%D1%96%D0%B2%D0%B5%D1%86%D1%8C%D0%BA%D0%B8%D0%B9%D0%9F%D1%80%D0%BE%D0%BC%D1%96%D0%BD%D1%8C",
    title: 'activism.media.chpromin.speech' as TranslationKey,
    type: "youtube"
  },
  {
    url: "https://www.facebook.com/share/v/1NAuudVHeS/",
    title: 'activism.media.event.video' as TranslationKey,
    type: "facebook"
  },
  {
    url: "https://www.facebook.com/ulia.martinuk.722617/videos/2846742102132502",
    title: 'activism.media.story' as TranslationKey,
    type: "facebook"
  }
];

export function ActivismSection() {
  const [isClient, setIsClient] = useState(false);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t } = useTranslation();

  // Перевірка, чи використовується темна тема
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Перевіряємо, чи встановлена темна тема
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
      
      // Слухаємо зміни теми
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            const isDarkNow = document.documentElement.classList.contains('dark');
            setIsDarkMode(isDarkNow);
          }
        });
      });
      
      observer.observe(document.documentElement, { attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);

  // Перевірка, що ми на клієнтській стороні
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Отримання кількості ініціатив для категорії
  const getCategoryCount = (category: TranslationKey) => {
    return CATEGORY_COUNTS[category] || 0;
  };

  // Рендер категорії
  const renderCategoryCard = (category: TranslationKey, descriptionKey: TranslationKey) => (
    <div className="activism-card bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-lg overflow-hidden shadow-lg p-6 flex flex-col">
      <h3 className="text-2xl font-bold mb-4 text-pink-500 dark:text-pink-300">{t(category)}</h3>
      <div className="flex-grow">
        <p className="activism-card-text mb-6">
          {t(descriptionKey)}
        </p>
        <p className="text-3xl font-bold text-pink-500 dark:text-pink-300 mb-4">
          {getCategoryCount(category)}
        </p>
      </div>
      {category === CATEGORIES.MEDIA && (
        <button 
          onClick={onOpen}
          className="activism-nav-button rounded-md px-4 py-2 mt-4 w-full flex items-center justify-center"
        >
          <span>{t('activism.view' as TranslationKey)}</span>
          <IconChevronRight className="w-5 h-5 ml-1" />
        </button>
      )}
    </div>
  );

  // Рендерінг галереї ParallaxScroll
  const renderGallery = () => {
    if (!isClient) {
      // Повертаємо просту заглушку, поки не завантажиться клієнтська сторона
      return (
        <div className="w-full h-[450px] bg-white/5 dark:bg-gray-800/20 rounded-lg flex items-center justify-center">
          <p className="activism-text">{t('activism.gallery.loading' as TranslationKey)}</p>
        </div>
      );
    }
    
    return (
      <div className="w-full">
        <ParallaxScrollFocusSimple images={galleryImages} />
      </div>
    );
  };

  // Рендер посилання на медіа
  const renderMediaLink = (link: {url: string, title: TranslationKey, type: string}, index: number) => (
    <a 
      key={index}
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center p-4 bg-white/5 dark:bg-gray-700/20 border border-pink-500/10 dark:border-pink-300/10 rounded-lg hover:bg-pink-500/5 dark:hover:bg-pink-300/5 transition-colors backdrop-blur-sm"
    >
      {link.type === 'youtube' ? (
        <IconBrandYoutube className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
      ) : (
        <IconBrandFacebook className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" />
      )}
      <span className="text-sm md:text-base activism-card-text">{t(link.title)}</span>
    </a>
  );

  return (
    <section id="activism" className="min-h-screen flex items-center justify-center">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="flex items-center justify-center mb-12">
          <IconHeartHandshake className="w-8 h-8 mr-2 text-pink-500 dark:text-pink-300" />
          <h2 className="activism-title text-4xl font-bold">{t('activism.title' as TranslationKey)}</h2>
        </div>
        
        <>
          {/* Категорії активізму - 3 картки */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {renderCategoryCard(
              CATEGORIES.VOLUNTEERING,
              "activism.volunteering.description" as TranslationKey
            )}
            
            {renderCategoryCard(
              CATEGORIES.TRAINING,
              "activism.trainings.description" as TranslationKey
            )}
            
            {renderCategoryCard(
              CATEGORIES.MEDIA,
              "activism.media.description" as TranslationKey
            )}
          </div>
          
          {/* Галерея */}
          <div className="mb-16">
            <div className="flex items-center justify-center mb-8">
              <h3 className="activism-subtitle text-2xl font-semibold">{t('activism.gallery.title' as TranslationKey)}</h3>
            </div>
            {renderGallery()}
          </div>
          
          <div className="mt-16 text-center">
            <a 
              href="https://www.facebook.com/fsymvoly" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium rounded-md px-6 py-3 inline-flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
            >
              <IconHeartHandshake className="w-5 h-5 mr-2" />
              <span>{t('activism.join.initiatives' as TranslationKey)}</span>
            </a>
          </div>
        </>
        
        {/* Модальне вікно з медіа-посиланнями через HeroUI */}
        <Modal 
          isOpen={isOpen} 
          onOpenChange={onOpenChange}
          backdrop="blur"
          isDismissable={true}
          size="3xl" 
          style={{
            background: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)'
          }}
          classNames={{
            base: isDarkMode 
              ? "!bg-gray-900 !text-white border border-pink-300/20 backdrop-blur-md w-full max-w-4xl"
              : "!bg-white border border-pink-500/20 backdrop-blur-md w-full max-w-4xl",
            wrapper: isDarkMode ? "!bg-gray-900/50" : "bg-black/50",
            header: "border-b-0",
            body: "py-4",
            footer: "border-t-0 bg-transparent",
            closeButton: isDarkMode ? "!text-white" : "text-gray-800"
          }}
        >
          <ModalContent 
            style={{
              background: isDarkMode ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)',
              width: '100%', 
              maxWidth: '900px'
            }}
          >
            {(onClose) => (
              <>
                <ModalHeader className="flex justify-between items-center">
                  <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-pink-300' : 'text-pink-500'}`}>
                    {t('activism.media.materials' as TranslationKey)}
                  </h3>
                </ModalHeader>
                <ModalBody>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mediaLinks.map((link, index) => renderMediaLink(link, index))}
                  </div>
                </ModalBody>
                <ModalFooter 
                  style={{
                    background: isDarkMode ? 'rgb(17, 24, 39)' : 'rgb(255, 255, 255)'
                  }}
                >
                  <Button 
                    color="danger" 
                    variant="light" 
                    onPress={onClose}
                    style={{
                      background: isDarkMode ? 'rgba(244, 114, 182, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                      color: isDarkMode ? '#f9a8d4' : '#ec4899'
                    }}
                    className={isDarkMode 
                      ? "bg-pink-300/10 text-pink-300 hover:bg-pink-300/20" 
                      : "bg-pink-500/10 text-pink-500 hover:bg-pink-500/20"
                    }
                  >
                    {t('activism.close' as TranslationKey)}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </section>
  );
} 