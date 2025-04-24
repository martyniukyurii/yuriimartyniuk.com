"use client";

import { useState } from 'react';
import { IconArrowLeft, IconCalendar, IconChevronLeft, IconChevronRight, IconEye, IconLink, IconTag } from '@tabler/icons-react';
import Link from 'next/link';

import { formatDate } from '@/lib/utils';
import { IPost, Media } from '@/app/models/Post';
import '@/styles/blog.css';
import { getImageUrl, getVideoUrl, getVideoPosterUrl, getFileUrl } from '@/lib/media-utils';
import { useTranslation } from "@/lib/hooks/useTranslation";

// Компонент для відображення медіа карусель
const MediaCarousel = ({ media }: { media: Media[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };
  
  const handleNext = () => {
    setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
  };
  
  if (!media || media.length === 0) return null;
  
  const currentMedia = media[currentIndex];
  
  return (
    <div className="blog-carousel mb-6 relative">
      {media.length > 1 && (
        <>
          <button 
            aria-label="Попереднє зображення" 
            className="blog-carousel-nav blog-carousel-prev"
            onClick={handlePrev}
          >
            <IconChevronLeft className="w-5 h-5" />
          </button>
          <button 
            aria-label="Наступне зображення" 
            className="blog-carousel-nav blog-carousel-next"
            onClick={handleNext}
          >
            <IconChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
      
      {currentMedia.type === 'photo' && (
        <div>
          <img 
            alt={currentMedia.caption || ''}
            className="blog-media w-full max-h-[70vh] object-contain"
            src={getImageUrl(currentMedia)}
          />
          {currentMedia.caption && (
            <p className="blog-meta text-sm mt-2">{currentMedia.caption}</p>
          )}
        </div>
      )}
      
      {currentMedia.type === 'video' && (
        <div>
          {currentMedia.isExternal && currentMedia.mimeType === 'video/youtube' ? (
            <div className="relative pb-[56.25%] h-0 overflow-hidden">
              <iframe 
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={getVideoUrl(currentMedia)}
                title={currentMedia.caption || 'YouTube відео'}
              />
            </div>
          ) : (
            <video 
              controls
              className="blog-media w-full max-h-[70vh]"
              poster={getVideoPosterUrl(currentMedia)}
              src={getVideoUrl(currentMedia)}
            />
          )}
          {currentMedia.caption && (
            <p className="blog-meta text-sm mt-2">{currentMedia.caption}</p>
          )}
        </div>
      )}
      
      {currentMedia.type === 'document' && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <a 
            className="blog-link flex items-center hover:underline" 
            href={getFileUrl(currentMedia)} 
            rel="noopener noreferrer"
            target="_blank"
          >
            <IconLink className="w-5 h-5 mr-2" />
            Завантажити документ {currentMedia.fileName && `(${currentMedia.fileName})`}
          </a>
          {currentMedia.caption && (
            <p className="blog-meta text-sm mt-2">{currentMedia.caption}</p>
          )}
        </div>
      )}
      
      {media.length > 1 && (
        <div className="flex justify-center mt-2 space-x-2">
          {media.map((_, index) => (
            <button
              key={index}
              aria-label={`Перейти до зображення ${index + 1}`}
              className={`w-2 h-2 rounded-full ${
                index === currentIndex
                  ? 'bg-violet-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент для відображення окремого медіа файлу
const PostMedia = ({ media }: { media: Media }) => {
  if (media.type === 'photo') {
    return (
      <div className="mb-6">
        <img 
          alt={media.caption || ''}
          className="blog-media w-full max-h-[70vh] object-contain"
          src={getImageUrl(media)}
        />
        {media.caption && (
          <p className="blog-meta text-sm mt-2">{media.caption}</p>
        )}
      </div>
    );
  }
  
  if (media.type === 'video') {
    if (media.isExternal && media.mimeType === 'video/youtube') {
      // Відображення вбудованого YouTube відео
      return (
        <div className="mb-6">
          <div className="relative pb-[56.25%] h-0 overflow-hidden">
            <iframe 
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={getVideoUrl(media)}
              title={media.caption || 'YouTube відео'}
            />
          </div>
          {media.caption && (
            <p className="blog-meta text-sm mt-2">{media.caption}</p>
          )}
        </div>
      );
    }
    
    // Відображення звичайного відео
    return (
      <div className="mb-6">
        <video 
          controls
          className="blog-media w-full max-h-[70vh]"
          poster={getVideoPosterUrl(media)}
          src={getVideoUrl(media)}
        />
        {media.caption && (
          <p className="blog-meta text-sm mt-2">{media.caption}</p>
        )}
      </div>
    );
  }
  
  if (media.type === 'document') {
    return (
      <div className="mb-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <a 
          className="blog-link flex items-center hover:underline" 
          href={getFileUrl(media)} 
          rel="noopener noreferrer"
          target="_blank"
        >
          <IconLink className="w-5 h-5 mr-2" />
          Завантажити документ {media.fileName && `(${media.fileName})`}
        </a>
        {media.caption && (
          <p className="blog-meta text-sm mt-2">{media.caption}</p>
        )}
      </div>
    );
  }
  
  return null;
};

export default function BlogPostClient({ post }: { post: IPost | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Функція, що повертає URL якірного посилання на блог
  const getBlogAnchorUrl = () => {
    // Повертає посилання на секцію блогу на головній сторінці
    return '/#blog';
  };

  // Формуємо текст з урахуванням переносів рядків та посилань
  const formatPostText = (text: string) => {
    // Заміна URL на посилання
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const withLinks = text.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="blog-link hover:underline">${url}</a>`);
    
    // Заміна переносів рядків на <br>
    return withLinks.replace(/\n/g, '<br />');
  };

  if (!post) {
    return (
      <div className="min-h-screen py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <Link 
            className="blog-link flex items-center mb-8 hover:underline" 
            href={getBlogAnchorUrl()}
          >
            <IconArrowLeft className="w-5 h-5 mr-2" />
            {t('blog.return.to.blog')}
          </Link>
          
          <div className="text-center blog-text p-8 bg-white/5 dark:bg-gray-800/20 rounded-lg">
            {t('blog.post.not.found')}
          </div>
        </div>
      </div>
    );
  }

  // Визначаємо, чи є пост альбомом (кілька фото)
  const isAlbum = post.media && post.media.length > 1 && post.media.every(m => m.type === 'photo');

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <Link 
          className="blog-link flex items-center mb-8 hover:underline" 
          href={getBlogAnchorUrl()}
        >
          <IconArrowLeft className="w-5 h-5 mr-2" />
          {t('blog.return.to.blog')}
        </Link>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-4 bg-red-100 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        ) : (
          <article className="bg-white/10 dark:bg-gray-800/30 backdrop-blur-md rounded-lg overflow-hidden shadow-lg p-6">
            <h1 className="blog-title text-3xl font-bold mb-4">
              {post.text.length > 100 ? post.text.substring(0, 100) + '...' : post.text}
            </h1>
            
            <div className="flex flex-wrap items-center text-sm blog-meta mb-6 gap-4">
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
              
              {post.url && (
                <a 
                  className="blog-link hover:underline text-sm" 
                  href={post.url} 
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {t('blog.original.in.telegram')}
                </a>
              )}
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
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
            
            {/* Відображення медіа-файлів */}
            {post.media && post.media.length > 0 && (
              <div className="mb-8">
                {isAlbum ? (
                  <MediaCarousel media={post.media.map(m => ({...m, url: m.url || ''}))} />
                ) : (
                  post.media.map((media, index) => (
                    <PostMedia key={`${media.fileId || index}`} media={{...media, url: media.url || ''}} />
                  ))
                )}
              </div>
            )}
            
            {/* Відображення тексту поста */}
            <div 
              dangerouslySetInnerHTML={{ __html: formatPostText(post.text) }}
              className="blog-content prose prose-lg dark:prose-invert prose-violet max-w-none"
            />
          </article>
        )}
      </div>
    </div>
  );
} 