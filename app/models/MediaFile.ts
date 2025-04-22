import mongoose, { Schema, Document } from 'mongoose';

export interface IMediaFile extends Document {
  fileId: string;         // Унікальний ідентифікатор файлу (для референсів)
  mediaType: string;      // Тип медіа (фото, відео, документ)
  mimeType: string;       // MIME тип файлу
  fileName: string;       // Ім'я файлу
  gridFSId: mongoose.Types.ObjectId; // ID файлу в GridFS
  thumbnail?: Buffer;     // Превʼю (для відео)
  messageId: number;      // ID повідомлення в Telegram
  createdAt: Date;        // Час створення запису
}

// Схема для MongoDB
const mediaFileSchema = new Schema<IMediaFile>({
  fileId: { type: String, required: true, unique: true },
  mediaType: { type: String, enum: ['photo', 'video', 'document'], required: true },
  mimeType: { type: String, required: true },
  fileName: { type: String, required: true },
  gridFSId: { type: mongoose.Schema.Types.ObjectId, required: true },
  thumbnail: { type: Buffer },
  messageId: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Перевірка, чи існує вже модель для HMR в Next.js
export default mongoose.models.MediaFile || mongoose.model<IMediaFile>('MediaFile', mediaFileSchema); 