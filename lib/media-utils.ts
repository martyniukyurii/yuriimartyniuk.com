import { Media } from '@/app/models/Post';

/**
 * Отримує URL для зображення
 */
export function getImageUrl(media: any): string {
  // Якщо це зовнішнє посилання
  if (media.isExternal) {
    return media.url;
  }
  
  // Якщо це локальне зображення з API (переконуємось, що воно завантажується з бази даних)
  if (!media.url.startsWith('/api/media/')) {
    return `/api/media/${media.fileId}`;
  }
  
  return media.url;
}

/**
 * Отримує URL для відео
 */
export function getVideoUrl(media: any): string {
  // Якщо це YouTube відео, перетворюємо URL на embeddable
  if (media.isExternal && media.mimeType === 'video/youtube') {
    const match = media.url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  // Для Vimeo відео
  if (media.isExternal && media.mimeType === 'video/vimeo') {
    return media.url;
  }
  
  // Для локальних відео переконуємось, що вони завантажуються з бази даних
  if (!media.isExternal && !media.url.startsWith('/api/media/')) {
    return `/api/media/${media.fileId}`;
  }
  
  // Інакше повертаємо URL як є
  return media.url;
}

/**
 * Отримує URL для постера відео
 */
export function getVideoPosterUrl(media: any): string {
  // Якщо є спеціальне поле для превʼю
  if (media.thumbnailUrl) {
    // Переконуємося, що превʼю завантажується з бази даних
    if (!media.thumbnailUrl.startsWith('/api/media/') && !media.isExternal) {
      return `/api/media/${media.fileId}?thumbnail=true`;
    }
    return media.thumbnailUrl;
  }
  
  // Для YouTube відео отримуємо превʼю
  if (media.isExternal && media.mimeType === 'video/youtube') {
    return getYoutubeThumbnail(media.url);
  }
  
  // Для Vimeo відео
  if (media.isExternal && media.mimeType === 'video/vimeo') {
    // Використовуємо URL з Vimeo API для отримання превʼю - якщо потрібно, його можна додати
    return media.url;
  }
  
  // Якщо це зовнішнє посилання на Telegram, додаємо параметр preview=1
  if (media.isExternal && media.url.includes('t.me/')) {
    return `${media.url}${media.url.includes('?') ? '&' : '?'}preview=1`;
  }
  
  // Для інших зовнішніх відео повертаємо URL
  if (media.isExternal) {
    return media.url;
  }
  
  // Для локальних відео додаємо параметр poster=true
  // Переконуємося, що URL починається з /api/media/
  const baseUrl = media.url.startsWith('/api/media/') 
    ? media.url 
    : `/api/media/${media.fileId}`;
  
  return `${baseUrl}?poster=true`;
}

/**
 * Отримує URL для файлу документу
 */
export function getFileUrl(media: any): string {
  if (media.isExternal) {
    return media.url;
  }
  
  // Переконуємося, що документи завантажуються з бази даних
  if (!media.url.startsWith('/api/media/')) {
    return `/api/media/${media.fileId}`;
  }
  
  return media.url;
}

/**
 * Отримує URL для превʼю YouTube відео
 */
export function getYoutubeThumbnail(url: string): string {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (match && match[1]) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
  }
  return '';
} 