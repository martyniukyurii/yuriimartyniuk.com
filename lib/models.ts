// Re-експортуємо моделі з їхніх файлів
import PostModel, { Media as MediaType, IPost } from '@/app/models/Post';
import MediaFileModel, { IMediaFile } from '@/app/models/MediaFile';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

// Експортуємо інтерфейси та моделі
export type Media = MediaType;
export type Post = IPost;
export type MediaFile = IMediaFile;

// Експортуємо моделі для використання
export { default as Post } from '@/app/models/Post';
export { default as MediaFile } from '@/app/models/MediaFile';

// Допоміжна функція для отримання GridFS bucket
export const getGridFS = async () => {
  const conn = mongoose.connection;
  if (!conn || !conn.db) {
    throw new Error('MongoDB не підключено. Спочатку викличте connectToDatabase()');
  }
  return new GridFSBucket(conn.db);
};

// Створюємо API для доступу до медіа-файлів
export const Media = {
  // Пошук медіа-файлу за ID
  findOne: async ({ fileId }: { fileId: string }) => {
    // Спочатку шукаємо в колекції MediaFile
    const mediaFile = await MediaFileModel.findOne({ fileId });
    if (mediaFile) {
      try {
        // Отримуємо файл з GridFS
        const bucket = await getGridFS();
        const downloadStream = bucket.openDownloadStream(mediaFile.gridFSId);
        
        // Зчитуємо дані в буфер
        const chunks: Buffer[] = [];
        for await (const chunk of downloadStream) {
          chunks.push(Buffer.from(chunk));
        }
        
        return {
          fileId: mediaFile.fileId,
          data: Buffer.concat(chunks as unknown as Uint8Array[]),
          mimeType: mediaFile.mimeType,
          fileName: mediaFile.fileName,
          mediaType: mediaFile.mediaType
        };
      } catch (error) {
        console.error(`Помилка при отриманні файлу з GridFS: ${error}`);
        
        // Якщо не вдалось отримати з GridFS, повертаємо порожній буфер
        return {
          fileId: mediaFile.fileId,
          data: Buffer.from(''),
          mimeType: mediaFile.mimeType,
          fileName: mediaFile.fileName,
          mediaType: mediaFile.mediaType
        };
      }
    }
    
    // Якщо не знайдено в MediaFile, повертаємо заглушку
    return {
      fileId,
      data: Buffer.from(''),
      mimeType: 'application/octet-stream',
      fileName: 'file'
    };
  }
};

export default {
  Post: PostModel,
  MediaFile: MediaFileModel,
  Media,
  getGridFS
}; 