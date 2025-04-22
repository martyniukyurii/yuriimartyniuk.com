import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../lib/mongodb';
import Post from '../../models/Post';

export async function GET() {
  try {
    await connectToDatabase();
    
    // Отримуємо всі унікальні теги
    const posts = await Post.find({}, { tags: 1 }).lean();
    
    // Вилучаємо унікальні теги з усіх постів
    const allTags = posts.flatMap(post => post.tags || []);
    const uniqueTags = Array.from(new Set(allTags));
    
    return NextResponse.json({
      tags: uniqueTags
    });
  } catch (error) {
    console.error('Помилка при отриманні тегів:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати теги' },
      { status: 500 }
    );
  }
} 