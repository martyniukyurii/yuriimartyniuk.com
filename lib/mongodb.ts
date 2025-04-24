import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Завантаження змінних середовища з .env.local
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';

if (!MONGODB_URI) {
  throw new Error(
    'Будь ласка, визначте змінну оточення MONGODB_URI у файлі .env.local'
  );
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Глобальна змінна для кешування підключення
let cached: MongooseConnection = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Функція для підключення до бази даних MongoDB
 */
export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }
  
  try {
    cached.conn = await cached.promise;

    return cached.conn;
  } catch (e) {
    cached.promise = null;
    console.error('Помилка підключення до MongoDB:', e);
    throw e;
  }
}

// Додаємо декларацію типів для глобальної змінної
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection;
}

export default connectToDatabase; 