import React, { useState } from 'react';
import { IconCalendar, IconEye, IconTag } from '@tabler/icons-react';
import Link from 'next/link';

import { formatDate } from '@/lib/utils';
import { IPost, Media } from '@/app/models/Post';

import '@/styles/blog.css';
import { getImageUrl, getVideoPosterUrl } from '@/lib/media-utils';

import { Skeleton } from '@heroui/react';

import { useTranslation } from "@/lib/hooks/useTranslation";

interface BlogPostCardProps {
  post: IPost;
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { t } = useTranslation();
  
  // Вибираємо першу медіа для відображення
  const featuredMedia = post.media && post.media.length > 0 ? post.media[0] : null;
  
  // Функція для визначення типу медіа-контенту (одне фото, альбом чи відео)
  const getMediaType = () => {
    if (!post.media || post.media.length === 0) return 'none';
    if (post.media.length > 1) return 'album';

    return post.media[0].type;
  };
  
  const mediaType = getMediaType();

  // Функція, що повертає URL якірного посилання на блог
  const getBlogAnchorUrl = () => {
    // Повертає посилання на секцію блогу на головній сторінці
    return '/#blog';
  };

  // Функція для отримання URL превью відео з YouTube
  const getYouTubeThumbUrl = (youtubeUrl: string) => {
    // Витягаємо id відео з різних форматів YouTube посилань
    const match = youtubeUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);

    if (match && match[1]) {
      return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
    }

    return undefined;
  };

  // Функція для нормалізації URL зображення
  const getNormalizedImageUrl = (media: Media) => {
    // Якщо це YouTube відео
    if (media.isExternal && media.mimeType === 'video/youtube') {
      return getYouTubeThumbUrl(media.url ?? '');
    }
    
    // Якщо це зовнішнє посилання на Telegram
    if (media.isExternal && media.url?.includes('t.me/')) {
      return media.url;
    }
    
    // Якщо це зовнішнє посилання на інший ресурс
    if (media.isExternal) {
      return media.url || '';
    }
    
    // Інакше додаємо параметр для отримання превью
    return `${media.url || ''}?poster=true`;
  };

  // Відображення медіа-файлу
  const renderMedia = () => {
    if (!featuredMedia) return null;
    
    switch (featuredMedia.type) {
      case 'photo':
        return (
          <div className="w-full h-full aspect-video md:aspect-auto relative">
            <Skeleton className="absolute inset-0 rounded-lg">
              <div className="h-full w-full rounded-lg bg-default-300" />
            </Skeleton>
            <img 
              alt={post.text.substring(0, 50)} 
              className={`blog-media w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'}`}
              src={getImageUrl(featuredMedia)}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        );
      case 'video':
        return (
          <div className="relative w-full h-full aspect-video md:aspect-auto">
            <Skeleton className="absolute inset-0 rounded-lg">
              <div className="h-full w-full rounded-lg bg-default-300" />
            </Skeleton>
            <img 
              alt="Відео превью" 
              className={`blog-media w-full h-full object-cover absolute inset-0 transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-100' : 'opacity-0'}`}
              src={getVideoPosterUrl(featuredMedia)}
              onError={() => setImageError(true)}
              onLoad={() => setImageLoaded(true)}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 z-10">
              <div className="w-16 h-16 rounded-full bg-white bg-opacity-80 flex items-center justify-center">
                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-16 border-l-violet-600 border-b-8 border-b-transparent ml-1" />
              </div>
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700 aspect-video md:aspect-auto">
            <span className="text-gray-500 dark:text-gray-400">
              {featuredMedia.fileName || 'Документ'}
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="blog-card flex flex-col md:flex-row gap-6 bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-lg overflow-hidden shadow-lg transition-all duration-300 md:w-[70%] mx-auto">
      {featuredMedia && (
        <div className="md:w-2/5 relative h-[250px] md:h-auto">
          {renderMedia()}
          
          {/* Відображення індикатора альбому */}
          {mediaType === 'album' && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              Альбом ({post.media?.length} фото)
            </div>
          )}
          
          {/* Відображення індикатора відео */}
          {mediaType === 'video' && (
            <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
              {featuredMedia.isExternal && featuredMedia.mimeType === 'video/youtube' ? 'YouTube' : 'Відео'}
            </div>
          )}
        </div>
      )}
              
      <div className="p-6 md:w-3/5 flex flex-col">
        <h3 className="blog-title text-xl font-bold mb-2">
          {post.text.length > 70 ? post.text.substring(0, 70) + '...' : post.text}
        </h3>
                
        <div className="flex items-center text-sm blog-meta mb-4 space-x-4">
          <span className="flex items-center">
            <IconCalendar className="w-4 h-4 mr-1" />
            <span>{formatDate(post.date)}</span>
          </span>
          
          {post.views !== undefined && (
            <span className="flex items-center">
              <IconEye className="w-4 h-4 mr-1" />
              <span>{post.views} {t('blog.views')}</span>
            </span>
          )}
        </div>
                
        {!featuredMedia && post.text && (
          <p className="blog-text mb-4 flex-grow">
            {post.text.length > 150 ? post.text.substring(0, 150) + '...' : post.text}
          </p>
        )}
                
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.map((tag) => (
              <Link 
                key={tag} 
                className="blog-tag flex items-center px-2 py-1 text-xs rounded-md"
                href={`${getBlogAnchorUrl()}?tag=${tag}`}
              >
                <IconTag className="w-3 h-3 mr-1" />
                {tag}
              </Link>
            ))}
          </div>
        )}
                
        <div className="mt-auto">
          <Link 
            className="blog-nav-button inline-block px-4 py-2 rounded-md transition-colors duration-300" 
            href={`/blog/${post.slug}`}
          >
            {t('blog.read.more')}
          </Link>
        </div>
      </div>
    </div>
  );
} 