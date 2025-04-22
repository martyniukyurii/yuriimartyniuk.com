import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';
import Post from '../../../models/Post';

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  try {
    // Використовуємо await для отримання параметрів
    const resolvedParams = await Promise.resolve(params);
    const { slug } = resolvedParams;
    
    if (!slug) {
      return NextResponse.json(
        { error: 'Не вказано slug поста' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();
    
    // Знаходимо пост за slug
    const post = await Post.findOne({ slug }).lean();
    
    if (!post) {
      return NextResponse.json(
        { error: 'Пост не знайдено' },
        { status: 404 }
      );
    }
    // Інкрементуємо лічильник переглядів
    await Post.updateOne({ slug }, { $inc: { views: 1 } });
    
    return NextResponse.json(post);
  } catch (error) {
    console.error('Помилка при отриманні поста:', error);
    return NextResponse.json(
      { error: 'Не вдалося отримати пост' },
      { status: 500 }
    );
  }
} 