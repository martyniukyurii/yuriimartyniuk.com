import { NextResponse } from 'next/server';

import { connectToDatabase } from '../../../lib/mongodb';
import Post from '../../models/Post';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const tag = url.searchParams.get('tag');

    await connectToDatabase();

    const skip = (page - 1) * limit;
    
    const query: any = {};
    
    // Фільтрація за тегом, якщо вказано
    if (tag) {
      query.tags = tag;
    }
    
    // Отримуємо пости
    const posts = await Post.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Обробляємо URL медіа, щоб вони завантажувались з MongoDB
    const processedPosts = posts.map((post: any) => {
      if (post.media && post.media.length > 0) {
        post.media = post.media.map((media: any) => {
          // Якщо медіа вже має зовнішнє посилання, не змінюємо URL
          if (media.isExternal) {
            return media;
          }
          
          // Переконуємось, що URL посилається на API маршрут для завантаження з MongoDB
          return {
            ...media,
            url: `/api/media/${media.fileId || media._id}`,
          };
        });
      }

      return post;
    });
    
    // Загальна кількість постів для пагінації
    const total = await Post.countDocuments(query);
    
    return NextResponse.json({
      posts: processedPosts,
      metadata: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('Помилка при отриманні постів:', error);

    return NextResponse.json(
      { error: 'Не вдалося отримати пости' },
      { status: 500 }
    );
  }
} 