import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import {
  LANGUAGE_COOKIE,
  LANGUAGE_COOKIE_MAX_AGE,
  LANGUAGE_HEADER,
  PATHNAME_HEADER,
  detectLanguage,
  isSiteLanguage,
} from './lib/language-detection';

// Визначаємо мову сторінки: вибір користувача (cookie або ?lang=) → країна за IP → мова браузера
function withLanguage(request: NextRequest) {
  const queryLanguage = request.nextUrl.searchParams.get('lang');
  const cookieLanguage = request.cookies.get(LANGUAGE_COOKIE)?.value;
  const language = isSiteLanguage(queryLanguage)
    ? queryLanguage
    : isSiteLanguage(cookieLanguage)
      ? cookieLanguage
      : detectLanguage({
          country: request.headers.get('x-vercel-ip-country'),
          acceptLanguage: request.headers.get('accept-language'),
        });

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(LANGUAGE_HEADER, language);
  requestHeaders.set(PATHNAME_HEADER, request.nextUrl.pathname);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (isSiteLanguage(queryLanguage) && queryLanguage !== cookieLanguage) {
    response.cookies.set(LANGUAGE_COOKIE, queryLanguage, {
      path: '/',
      maxAge: LANGUAGE_COOKIE_MAX_AGE,
      sameSite: 'lax',
    });
  }

  return response;
}

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
  
  return withLanguage(request);
}

export const config = {
  // 3D-моделі та всі сторінки (без API, службових файлів Next.js і статики)
  matcher: [
    '/3D_models/:path*',
    '/((?!api|_next/static|_next/image|.*\\..*).*)',
  ],
}; 