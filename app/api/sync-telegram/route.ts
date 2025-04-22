import { NextResponse } from 'next/server';
import { parseMessages } from '../../../scripts/telegram-parser';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 хвилин

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const apiKey = url.searchParams.get('apiKey');
    
    // Перевірка ключа API для безпеки
    if (apiKey !== process.env.TELEGRAM_SYNC_API_KEY) {
      return NextResponse.json(
        { error: 'Невірний API-ключ' },
        { status: 401 }
      );
    }
    
    // Запускаємо парсинг
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    
    const result = await parseMessages(limit);
    
    return NextResponse.json({
      success: true,
      message: 'Парсинг завершено успішно',
      result
    });
  } catch (error) {
    console.error('Помилка при синхронізації з Telegram:', error);
    return NextResponse.json(
      { error: 'Сталася помилка при синхронізації з Telegram' },
      { status: 500 }
    );
  }
} 