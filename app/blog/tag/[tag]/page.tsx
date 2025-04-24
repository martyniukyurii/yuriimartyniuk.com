"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';

export default function TagRedirect({ params }: { params: Promise<{ tag: string }> }) {
  const router = useRouter();
  // Використовуємо use() для клієнтського компоненту замість await (який не можна використовувати напряму в клієнтському компоненті)
  const { tag } = use(params);
  
  useEffect(() => {
    // Перенаправляємо на головну сторінку з параметром тегу
    router.push(`/#blog?tag=${encodeURIComponent(tag)}`);
  }, [router, tag]);
  
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700" />
    </div>
  );
} 