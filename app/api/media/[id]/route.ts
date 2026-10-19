import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

import { MediaFile, Post } from '@/lib/models';
import { connectToDatabase } from '@/lib/mongodb';
import { telegramFile } from '@/lib/telegram-api';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{id: string}> }
) {
  try {
    // Чекаємо на розв'язання Promise params перед доступом до властивості id
    const { id } = await params;

    await connectToDatabase();
    
    const isThumbnail = request.nextUrl.searchParams.has('thumbnail');

    // Telegram stores the bytes. The website stores only an opaque public ID and file_id.
    const botPost = await Post.findOne({ deleted: { $ne: true }, 'media.fileId': id, 'media.telegramFileId': { $exists: true } });
    const botMedia = botPost?.media?.find((media: any) => media.fileId === id && media.telegramFileId);
    if (botMedia) {
      const fileId = isThumbnail ? botMedia.thumbnailFileId : botMedia.telegramFileId;
      if (!fileId) return new NextResponse('Thumbnail not found', { status: 404 });
      const headers = new Headers();
      const range = request.headers.get('range');
      if (range && /^bytes=\d*-\d*$/.test(range)) headers.set('Range', range);
      const upstream = await fetch(await telegramFile(fileId), { headers, cache: 'no-store', signal: AbortSignal.timeout(45000) });
      if (!upstream.ok && upstream.status !== 416) return new NextResponse('Telegram media unavailable', { status: 502 });
      const responseHeaders = new Headers({
        'Content-Type': isThumbnail ? 'image/jpeg' : (/^(image\/(jpeg|png|webp|gif|avif)|video\/(mp4|webm|quicktime)|audio\/[a-z0-9.+-]+)$/.test(botMedia.mimeType || '') ? botMedia.mimeType : 'application/octet-stream'),
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      });
      for (const name of ['content-length', 'content-range', 'accept-ranges']) {
        const value = upstream.headers.get(name);
        if (value) responseHeaders.set(name, value);
      }
      if (botMedia.type === 'document') responseHeaders.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(botMedia.fileName || 'file')}`);
      // No redirect, token in the browser, or full-file Buffer allocation.
      return new NextResponse(upstream.body, { status: upstream.status, headers: responseHeaders });
    }
    
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
    const post = await Post.findOne({ deleted: { $ne: true }, 'media.fileId': id });

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
    if (id.startsWith('tg_')) return new NextResponse('Legacy media not found in storage', { status: 404 });
    
    return new NextResponse('Media not found', { status: 404 });
  } catch (error) {
    console.error('Помилка при обробці запиту медіа');

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
