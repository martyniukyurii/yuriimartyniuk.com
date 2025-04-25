import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Встановлюємо спеціальні заголовки для 3D-моделей
  if (pathname.startsWith('/3D_models/') && pathname.endsWith('.glb')) {
    // Логуємо запит до 3D-моделі для діагностики
    console.log(`3D model request: ${pathname}`);
    
    // Створюємо відповідь з правильними заголовками
    const response = NextResponse.next();
    
    // Встановлюємо CORS для доступу з будь-якого джерела
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    // Встановлюємо тип контенту для GLB-моделей
    response.headers.set('Content-Type', 'model/gltf-binary');
    
    // Кешування на 1 рік для статичних моделей
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    
    // Запобігаємо автоматичному завантаженню
    response.headers.set('Content-Disposition', 'inline');
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  // Застосовуємо middleware тільки для запитів до 3D-моделей
  // та для сторінок, які використовують ці моделі
  matcher: [
    '/3D_models/:path*',
    '/models-demo/:path*',
    '/'
  ],
}; 