import mongoose, { Schema, Document } from 'mongoose';

export interface Media {
  type: string;
  url?: string;
  fileId?: string;
  caption?: string;
  mimeType?: string;
  fileName?: string;
  thumbnailUrl?: string; // URL для превʼю медіа
  isExternal?: boolean; // Чи є посилання зовнішнім (наприклад, YouTube)
  
  // Telegram API медіа-дані
  telegramFileId?: string;
  telegramAccessHash?: string;
  telegramFileReference?: string;
  telegramDcId?: number;
}

export interface IPost extends Document {
  messageId: number;
  telegramId?: number; // додано поле telegramId для старих записів
  text: string;
  slug: string;
  date: Date;
  views?: number;
  media?: {
    type: string;
    fileId: string;
    mimeType?: string;
    fileName?: string;
    url?: string; // змінено на необов'язкове
    thumbnailUrl?: string;
    isExternal?: boolean;
    caption?: string; // додано поле caption
  }[];
  tags?: string[];
  url?: string; // посилання на повідомлення в Telegram
}

const mediaSchema = new Schema({
  type: { type: String, enum: ['photo', 'video', 'document'], required: true },
  url: { type: String, required: true },
  fileId: { type: String },
  caption: { type: String },
  mimeType: { type: String },
  fileName: { type: String },
  isExternal: { type: Boolean, default: false } // За замовчуванням - не зовнішнє
});

const postSchema = new Schema<IPost>({
  messageId: { type: Number, required: true, unique: true },
  text: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  views: { type: Number, default: 0 },
  media: [{
    type: { type: String, required: true },
    fileId: { type: String, required: true },
    mimeType: String,
    fileName: String,
    url: String,
    thumbnailUrl: String,
    isExternal: { type: Boolean, default: false }
  }],
  tags: [String],
  url: String // посилання на повідомлення в Telegram
}, { timestamps: true });

// Створення slug з тексту поста
postSchema.pre('save', function(next) {
  if (!this.isModified('text') && this.slug) {
    return next();
  }
  
  // Створення slug з перших 60 символів тексту
  this.slug = this.text
    .substring(0, 60)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яґєіїё\s]/gi, '')
    .replace(/\s+/g, '-');
    
  next();
});

export default mongoose.models.Post || mongoose.model<IPost>('Post', postSchema); 