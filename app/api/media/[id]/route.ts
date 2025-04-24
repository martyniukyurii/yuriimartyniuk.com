import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { MediaFile, Post } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    // Чекаємо на розв'язання Promise params перед доступом до властивості id
    const { id } = await params;

    await connectToDatabase();
    
    const isThumbnail = request.nextUrl.searchParams.has('thumbnail');
    
    // Перевіряємо, чи є файл в базі даних
    const mediaFile = await MediaFile.findOne({ fileId: id });
    
    if (mediaFile) {
      // Якщо потрібно thumbnail і він є у запису
      if (isThumbnail && mediaFile.thumbnail) {
        return new NextResponse(mediaFile.thumbnail, {
          headers: {
            'Content-Type': mediaFile.mimeType,
            'Content-Disposition': `inline; filename="thumbnail_${mediaFile.fileName}"`,
          }
        });
      }
      
      // Отримуємо файл з GridFS
      const conn = mongoose.connection;

      if (!conn.db) {
        throw new Error('База даних не підключена');
      }
      const db = conn.db;
      const bucket = new GridFSBucket(db);
      
      try {
        // Отримуємо читаючий потік
        const downloadStream = bucket.openDownloadStream(mediaFile.gridFSId);
        
        // Зчитуємо дані в буфер
        const chunks: Buffer[] = [];

        for await (const chunk of downloadStream) {
          chunks.push(Buffer.from(chunk));
        }
        
        const buffer = Buffer.concat(chunks as unknown as Uint8Array[]);
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mediaFile.mimeType,
            'Content-Disposition': `inline; filename="${mediaFile.fileName}"`,
          }
        });
      } catch (gridFsError: any) {
        console.error('Помилка при отриманні файлу з GridFS:', gridFsError);
        
        // Файлу немає в GridFS - повідомляємо про помилку
        return new NextResponse('Media file not found in storage', { status: 404 });
      }
    }
    
    // Файлу немає в базі - отримуємо інформацію про пост
    const post = await Post.findOne({ 'media.fileId': id });

    if (!post) {
      return new NextResponse('Post not found', { status: 404 });
    }
    
    // Знаходимо конкретний медіа
    const mediaInfo = post.media.find((m: any) => m.fileId === id);
    
    if (!mediaInfo) {
      return new NextResponse('Media not found', { status: 404 });
    }
    
    // Якщо це зовнішнє джерело (YouTube тощо), перенаправляємо
    if (mediaInfo.isExternal && mediaInfo.url) {
      return NextResponse.redirect(mediaInfo.url);
    }
    
    // Якщо це медіа з Telegram, але немає запису в базі - повідомляємо
    if (id.startsWith('tg_')) {
      const parts = id.split('_');
      const messageId = parseInt(parts[2]);
      const telegramUrl = `https://t.me/${process.env.TELEGRAM_CHANNEL_USERNAME?.replace('@', '')}/${messageId}`;
      
      return NextResponse.redirect(telegramUrl);
    }
    
    return new NextResponse('Media not found', { status: 404 });
  } catch (error) {
    console.error('Помилка при обробці запиту медіа:', error);

    return new NextResponse('Internal server error', { status: 500 });
  }
}

// CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
} 