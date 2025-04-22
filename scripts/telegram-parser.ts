import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { connectToDatabase } from '../lib/mongodb';
import cron from 'node-cron';
import Post, { Media } from '../app/models/Post';
import MediaFile from '../app/models/MediaFile';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Завантаження змінних середовища з .env.local
dotenv.config({ path: '.env.local' });

// Змінні середовища
const API_ID = process.env.TELEGRAM_API_ID || '';
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_KEY = process.env.TELEGRAM_SESSION_KEY || '';
const CHANNEL_USERNAME = process.env.TELEGRAM_CHANNEL_USERNAME || '';

// Перевіряємо змінні середовища
const validateEnv = () => {
  if (!API_ID || !API_HASH || !SESSION_KEY || !CHANNEL_USERNAME) {
    throw new Error('Відсутні змінні середовища для Telegram API');
  }
};

// Створюємо клієнт з налаштуваннями для запобігання TIMEOUT помилкам
const createClient = (): TelegramClient => {
  const stringSession = new StringSession(SESSION_KEY);
  return new TelegramClient(stringSession, parseInt(API_ID), API_HASH, {
    connectionRetries: 5,        // Збільшуємо кількість спроб з'єднання
    requestRetries: 5,           // Збільшуємо кількість спроб запитів
    timeout: 60000,              // Збільшуємо таймаут до 60 секунд
    useWSS: false,               // Вимикаємо WSS для стабільності
    maxConcurrentDownloads: 1,   // Обмежуємо кількість одночасних завантажень
    autoReconnect: true,         // Дозволяємо автоматичне перепідключення
    floodSleepThreshold: 60,     // Збільшуємо поріг для flood wait
    retryDelay: 3000,            // Затримка між спробами в мс
    downloadRetries: 5           // Кількість спроб завантаження
  });
};

/**
 * Отримує посилання на медіа-файли з сервера Telegram
 */
async function getMediaLinks(client: TelegramClient, message: any): Promise<Media[]> {
  const media: Media[] = [];

  try {
    // Перевіряємо, чи є YouTube посилання в тексті повідомлення
    if (message.message) {
      // YouTube посилання
      const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S+)?/g;
      const youtubeMatches = message.message.match(youtubeRegex);
      
      if (youtubeMatches && youtubeMatches.length > 0) {
        for (const youtubeUrl of youtubeMatches) {
          const match = youtubeUrl.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            const videoId = match[1];
            
            media.push({
              type: 'video',
              url: `https://www.youtube.com/embed/${videoId}`,
              fileId: `youtube_${videoId}`,
              caption: message.message || '',
              mimeType: 'video/youtube',
              isExternal: true
            });
          }
        }
      }
      
      // Vimeo посилання
      const vimeoRegex = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)(?:\S+)?/g;
      const vimeoMatches = message.message.match(vimeoRegex);
      
      if (vimeoMatches && vimeoMatches.length > 0) {
        for (const vimeoUrl of vimeoMatches) {
          const match = vimeoUrl.match(/(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/);
          if (match && match[1]) {
            const videoId = match[1];
            
            media.push({
              type: 'video',
              url: `https://player.vimeo.com/video/${videoId}`,
              fileId: `vimeo_${videoId}`,
              caption: message.message || '',
              mimeType: 'video/vimeo',
              isExternal: true
            });
          }
        }
      }
    }

    // Якщо маємо фото у повідомленні
    if (message.photo) {
      try {
        console.log(`Знайдено фото у повідомленні ${message.id}`);
        
        // Зберігаємо дані фото з Telegram API
        const photoObj = message.photo;
        
        // Створюємо стабільний file_id для нашого API без використання Date.now()
        const fileId = `tg_photo_${message.id}`;
        
        // Конвертуємо значення в рядок для MongoDB
        const telegramFileId = photoObj.id ? photoObj.id.toString() : '';
        const telegramAccessHash = photoObj.accessHash ? photoObj.accessHash.toString() : '';
        
        // Створюємо медіа-запис з референсом на Telegram photo
        media.push({
          type: 'photo',
          url: `/api/media/${fileId}`, // Це буде URL для нашого API роуту
          fileId: fileId,
          telegramFileId,
          telegramAccessHash,
          telegramFileReference: photoObj.fileReference ? Buffer.from(photoObj.fileReference).toString('base64') : undefined,
          telegramDcId: photoObj.dcId,
          caption: message.message || '',
          isExternal: false
        });
      } catch (photoError) {
        console.error('Помилка при обробці фото:', photoError);
        
        // Резервний варіант - використовуємо URL повідомлення
        media.push({
          type: 'photo',
          url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}/${message.id}`,
          fileId: `tg_photo_${message.id}`,
          caption: message.message || '',
          isExternal: true
        });
      }
    }

    // Якщо маємо відео у повідомленні
    if (message.video) {
      try {
        console.log(`Знайдено відео у повідомленні ${message.id}`);
        
        // Зберігаємо дані відео з Telegram API
        const videoObj = message.video;
        
        // Створюємо стабільний file_id для нашого API без використання Date.now()
        const fileId = `tg_video_${message.id}`;
        
        // Конвертуємо значення в рядок для MongoDB
        const telegramFileId = videoObj.id ? videoObj.id.toString() : '';
        const telegramAccessHash = videoObj.accessHash ? videoObj.accessHash.toString() : '';
        
        // Створюємо медіа-запис з референсом на Telegram video
        media.push({
          type: 'video',
          url: `/api/media/${fileId}`, // Це буде URL для нашого API роуту
          fileId: fileId,
          telegramFileId,
          telegramAccessHash,
          telegramFileReference: videoObj.fileReference ? Buffer.from(videoObj.fileReference).toString('base64') : undefined,
          telegramDcId: videoObj.dcId,
          caption: message.message || '',
          mimeType: videoObj.mimeType || 'video/mp4',
          thumbnailUrl: videoObj.thumbs && videoObj.thumbs.length > 0 ? 
            `/api/media/${fileId}?thumbnail=true` : undefined, // URL для превʼю
          isExternal: false
        });
      } catch (videoError) {
        console.error('Помилка при обробці відео:', videoError);
        
        // Резервний варіант - використовуємо URL повідомлення
        media.push({
          type: 'video',
          url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}/${message.id}`,
          fileId: `tg_video_${message.id}`,
          caption: message.message || '',
          mimeType: 'video/mp4',
          isExternal: true
        });
      }
    }

    // Якщо маємо документ у повідомленні
    if (message.document) {
      try {
        console.log(`Знайдено документ у повідомленні ${message.id}`);
        
        // Отримуємо ім'я файлу
        const fileName = message.document.attributes.find((attr: any) => attr.fileName)?.fileName || `doc_${message.id}`;
        
        // Отримуємо тип медіа за розширенням
        const fileExtension = fileName.split('.').pop()?.toLowerCase();
        const isVideo = fileExtension && ['mp4', 'avi', 'mov', 'webm'].includes(fileExtension);
        const isImage = fileExtension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension);
        
        // Зберігаємо дані документа з Telegram API
        const docObj = message.document;
        
        // Створюємо стабільний file_id для нашого API без використання Date.now()
        const fileId = `tg_doc_${message.id}`;
        
        // Конвертуємо значення в рядок для MongoDB
        const telegramFileId = docObj.id ? docObj.id.toString() : '';
        const telegramAccessHash = docObj.accessHash ? docObj.accessHash.toString() : '';
        
        // Визначаємо тип медіа
        let mediaType = 'document';
        if (isVideo) {
          mediaType = 'video';
        } else if (isImage) {
          mediaType = 'photo';
        }
        
        // Визначаємо MIME тип
        let mimeType = docObj.mimeType || 'application/octet-stream';
        if (isVideo && !mimeType.startsWith('video/')) {
          mimeType = 'video/mp4';
        } else if (isImage && !mimeType.startsWith('image/')) {
          mimeType = 'image/jpeg';
        }
        
        // Створюємо медіа-запис з референсом на Telegram document
        media.push({
          type: mediaType as 'photo' | 'video' | 'document',
          url: `/api/media/${fileId}`, // Це буде URL для нашого API роуту
          fileId: fileId,
          telegramFileId,
          telegramAccessHash,
          telegramFileReference: docObj.fileReference ? Buffer.from(docObj.fileReference).toString('base64') : undefined,
          telegramDcId: docObj.dcId,
          fileName: fileName,
          caption: message.message || '',
          mimeType: mimeType,
          isExternal: false
        });
      } catch (docError) {
        console.error('Помилка при обробці документу:', docError);
        
        // Резервний варіант - використовуємо URL повідомлення
        media.push({
          type: 'document',
          url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}/${message.id}`,
          fileId: `tg_doc_${message.id}`,
          caption: message.message || '',
          isExternal: true
        });
      }
    }

    return media;
  } catch (error) {
    console.error('Помилка при отриманні медіа-посилань:', error);
    return [];
  }
}

function createSlug(text: string): string {
  return text
    .substring(0, 60)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яґєіїё\s]/gi, '')
    .replace(/\s+/g, '-');
}

function getYoutubeId(url: string): string | null {
  const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  return match && match[1] ? match[1] : null;
}

function processYoutubeLinks(text: string): { processedText: string, youtubeMedia: any[] } {
  const youtubeMedia: any[] = [];
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)(?:\S+)?/g;
  
  const processedText = text.replace(youtubeRegex, (match) => {
    const videoId = getYoutubeId(match);
    if (videoId) {
      youtubeMedia.push({
        type: 'video',
        url: `https://www.youtube.com/embed/${videoId}`,
        fileId: `youtube_${videoId}`,
        mimeType: 'video/youtube',
        isExternal: true
      });
      
      return `[YouTube: https://youtu.be/${videoId}]`;
    }
    
    return match;
  });
  
  return { processedText, youtubeMedia };
}

// Зберігаємо медіа вміст у базу даних
async function saveMediaToDatabase(client: TelegramClient, message: any, mediaItem: Media): Promise<void> {
  // Пропускаємо, якщо це зовнішнє джерело або немає медіа
  if (mediaItem.isExternal || !message.media) {
    return;
  }
  
  try {
    console.log(`Перевірка медіа-файлу ${mediaItem.fileId} з повідомлення ${message.id}...`);
    
    // Перевіряємо, чи вже існує файл у базі даних
    const existingMediaFile = await MediaFile.findOne({ fileId: mediaItem.fileId });
    if (existingMediaFile) {
      console.log(`Медіа-файл ${mediaItem.fileId} вже існує в базі даних`);
      return;
    }
    
    console.log(`Завантажуємо медіа-файл ${mediaItem.fileId} з повідомлення ${message.id}...`);
    
    // Завантажуємо файл
    const buffer = await client.downloadMedia(message.media);
    
    if (!buffer) {
      console.error(`Помилка: Не вдалося завантажити медіа ${mediaItem.fileId}`);
      return;
    }
    
    // Підключення до GridFS
    const conn = await mongoose.connection;
    const db = conn.db;
    const { GridFSBucket } = require('mongodb');
    const bucket = new GridFSBucket(db);
    
    // Встановлюємо ім'я файлу та тип mime
    let fileName = `file_${message.id}.bin`;
    let mimeType = 'application/octet-stream';
    
    if (mediaItem.type === 'photo') {
      fileName = `photo_${message.id}.jpg`;
      mimeType = 'image/jpeg';
    } else if (mediaItem.type === 'video') {
      fileName = `video_${message.id}.mp4`;
      mimeType = mediaItem.mimeType || 'video/mp4';
    } else if (mediaItem.fileName) {
      fileName = mediaItem.fileName;
      mimeType = mediaItem.mimeType || 'application/octet-stream';
    }
    
    // Перевіряємо, чи є вже файл з таким самим ім'ям у GridFS
    let existingFiles = [];
    try {
      const cursor = bucket.find({ filename: fileName });
      existingFiles = await cursor.toArray();
    } catch (err) {
      console.error(`Помилка при пошуку файлів у GridFS: ${err}`);
    }
    
    if (existingFiles.length > 0) {
      console.log(`Файл з ім'ям ${fileName} вже існує в GridFS, оновлюємо...`);
      
      // Використовуємо існуючий файл
      const gridFSId = existingFiles[0]._id;
      
      // Створюємо новий запис медіа в базі даних
      const mediaFile = new MediaFile({
        fileId: mediaItem.fileId,
        mediaType: mediaItem.type,
        mimeType: mimeType,
        fileName: fileName,
        gridFSId: gridFSId,
        messageId: message.id,
        createdAt: new Date()
      });
      
      // Зберігаємо в базу даних
      await mediaFile.save();
      console.log(`Медіа-файл ${mediaItem.fileId} зареєстровано з існуючим GridFS ID: ${gridFSId}`);
      return;
    }
    
    // Завантаження файлу в GridFS
    const uploadStream = bucket.openUploadStream(fileName, {
      contentType: mimeType,
      metadata: { messageId: message.id, fileId: mediaItem.fileId }
    });
    
    const bufferData = buffer instanceof Buffer ? buffer : Buffer.from(buffer);
    uploadStream.write(bufferData);
    uploadStream.end();
    
    // Отримуємо id файлу після завантаження
    const gridFSId = await new Promise<mongoose.Types.ObjectId>((resolve, reject) => {
      uploadStream.on('finish', function(this: any) {
        resolve(this.id);
      });
      uploadStream.on('error', reject);
    });
    
    // Створюємо новий запис медіа в базі даних
    const mediaFile = new MediaFile({
      fileId: mediaItem.fileId,
      mediaType: mediaItem.type,
      mimeType: mimeType,
      fileName: fileName,
      gridFSId: gridFSId,
      messageId: message.id,
      createdAt: new Date()
    });
    
    // Зберігаємо в базу даних
    await mediaFile.save();
    console.log(`Медіа-файл ${mediaItem.fileId} збережено в GridFS з ID: ${gridFSId}`);
  } catch (e) {
    console.error(`Помилка при завантаженні медіа-файлу ${mediaItem.fileId}:`, e);
  }
}

// Парсимо та зберігаємо повідомлення
export async function parseMessages(limit = 1): Promise<{ processed: number; added: number }> {
  validateEnv();
  
  let client: TelegramClient | null = null;
  let processedCount = 0;
  let addedCount = 0;
  
  try {
    await connectToDatabase();
    
    client = createClient();
    
    await client.connect();
    console.log('Підключено до Telegram');
    
    // Отримуємо канал
    const channel = await client.getEntity(CHANNEL_USERNAME);
    
    console.log(`Парсимо останнє повідомлення з каналу ${CHANNEL_USERNAME}`);
    
    // Встановлюємо таймер для запобігання нескінченного очікування
    const timeout = setTimeout(() => {
      if (client) {
        console.log('Примусове відключення через таймаут...');
        client.disconnect();
        throw new Error('TIMEOUT: Примусове відключення після 45 секунд очікування');
      }
    }, 45000);
    
    // Отримуємо тільки останнє повідомлення з обмеженням часу виконання
    const messages = await Promise.race([
      client.getMessages(channel, {
        limit: 1,
      }),
      new Promise<any>((_, reject) => 
        setTimeout(() => reject(new Error('TIMEOUT: Запит повідомлень перевищив ліміт часу')), 40000)
      )
    ]) as any[];
    
    // Скасовуємо таймер, якщо запит успішний
    clearTimeout(timeout);
    
    processedCount = messages.length;
    console.log(`Знайдено ${processedCount} нових повідомлень`);
    
    // Обробляємо останнє повідомлення
    if (messages.length > 0) {
      const message = messages[0];
      
      if (!message.message && !message.media) {
        console.log(`Пропускаємо повідомлення ${message.id}: немає тексту або медіа`);
        return { processed: processedCount, added: 0 };
      }
      
      // Перевіряємо, чи існує повідомлення в базі
      const existingPost = await Post.findOne({ messageId: message.id });
      if (existingPost) {
        console.log(`Повідомлення ${message.id} вже існує в базі даних`);
        return { processed: processedCount, added: 0 };
      }
      
      console.log(`Обробка повідомлення ${message.id}`);
      
      try {
        // Отримуємо посилання на медіа, якщо є
        let mediaItems: Media[] = [];
        if (message.media || (message.message && message.message.includes('youtube.com') || message.message.includes('youtu.be'))) {
          mediaItems = await getMediaLinks(client, message);
          
          // Зберігаємо кожен медіа-файл в базу даних
          for (const mediaItem of mediaItems) {
            await saveMediaToDatabase(client, message, mediaItem);
          }
        }
        
        // Перевіряємо наявність URL у всіх медіа об'єктах
        if (mediaItems.length > 0) {
          mediaItems = mediaItems.map(media => {
            if (!media.url) {
              console.warn(`Медіа без URL:`, media);
              return {
                ...media,
                url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}/${message.id}`,
                isExternal: true
              };
            }
            return media;
          });
        }
        
        // Отримуємо текст повідомлення
        const text = message.message || `Повідомлення ${message.id}`;
        
        // Обробка YouTube посилань у тексті
        const { processedText, youtubeMedia } = processYoutubeLinks(text);
        
        // Додаємо YouTube медіа до загального списку
        if (youtubeMedia.length > 0) {
          mediaItems.push(...youtubeMedia);
        }
        
        // Створюємо slug
        const slug = createSlug(processedText);
        
        // Перевіряємо унікальність slug
        let uniqueSlug = slug;
        let slugSuffix = 1;
        while (await Post.findOne({ slug: uniqueSlug })) {
          uniqueSlug = `${slug}-${slugSuffix}`;
          slugSuffix++;
        }
        
        // Створюємо запис у базі даних
        const newPost = new Post({
          messageId: message.id,
          text: processedText,
          media: mediaItems,
          date: new Date(message.date * 1000), // Конвертуємо Unix timestamp у дату
          url: `https://t.me/${CHANNEL_USERNAME.replace('@', '')}/${message.id}`,
          slug: uniqueSlug, // Використовуємо унікальний slug
        });
        
        // Додаємо теги, якщо є хештеги в тексті
        const hashtags = processedText.match(/#[a-zа-яґєіїё0-9_]+/gi);
        if (hashtags) {
          newPost.tags = hashtags.map(tag => tag.substring(1));
        }
        
        console.log('Структура поста перед збереженням:', JSON.stringify({
          messageId: newPost.messageId,
          text: newPost.text ? newPost.text.substring(0, 30) + '...' : '',
          mediaCount: newPost.media?.length || 0,
          date: newPost.date,
          slug: newPost.slug,
          url: newPost.url
        }));
        
        // Зберігаємо пост
        await newPost.save();
        addedCount++;
        console.log(`Збережено повідомлення ${message.id}`);
      } catch (postError) {
        console.error(`Помилка при обробці повідомлення ${message.id}:`, postError);
      }
    }
    
    console.log('Парсинг завершено');
    return { processed: processedCount, added: addedCount };
  } catch (error) {
    console.error('Помилка при парсингу повідомлень:', error);
    throw error;
  } finally {
    if (client) {
    try {
      await client.disconnect();
        console.log('Відключено від Telegram');
    } catch (disconnectError) {
      console.error('Помилка при відключенні клієнта:', disconnectError);
      }
    }
  }
}

// Запускаємо парсинг за розкладом (кожні 10 хвилин замість 5 хвилин)
const startScheduledParsing = () => {
  console.log('Запуск запланованого парсингу Telegram каналу...');
  cron.schedule('*/10 * * * *', async () => {
    console.log(`Запуск парсингу в ${new Date().toISOString()}`);
    try {
      await parseMessages(1); // Парсимо тільки 1 повідомлення
    } catch (error) {
      console.error('Помилка при плановому запуску парсера:', error);
      
      // Перезапуск парсера при помилці TIMEOUT
      if (error instanceof Error && error.message.includes('TIMEOUT')) {
        console.log('Виявлено помилку TIMEOUT, очікуємо 30 секунд і пробуємо знову...');
        setTimeout(async () => {
          try {
            console.log('Повторна спроба парсингу після TIMEOUT...');
            await parseMessages(1);
          } catch (retryError) {
            console.error('Повторна спроба не вдалася:', retryError);
          }
        }, 30000); // Чекаємо 30 секунд перед повторною спробою
      }
    }
  });
};

// Запуск парсеру як окремого процесу
if (require.main === module) {
  (async () => {
    try {
      await parseMessages(1); // Спочатку парсимо тільки останнє повідомлення
      startScheduledParsing(); // Потім запускаємо за розкладом
    } catch (error) {
      console.error('Помилка при запуску парсера:', error);
      process.exit(1);
    }
  })();
} 