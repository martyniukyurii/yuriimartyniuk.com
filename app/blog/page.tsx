"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BlogRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Отримуємо поточні параметри з URL
    const url = new URL(window.location.href);
    const params = url.searchParams;
    
    // Створюємо базове посилання на /#blog
    let redirectUrl = '/#blog';
    
    // Додаємо параметри, якщо вони є
    if (params.has('tag')) {
      redirectUrl += `?tag=${params.get('tag')}`;
    }
    
    // Виконуємо перенаправлення
    router.push(redirectUrl);
  }, [router]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700"></div>
    </div>
  );
} 