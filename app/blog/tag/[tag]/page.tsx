"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TagRedirect({ params }: { params: { tag: string } }) {
  const router = useRouter();
  const { tag } = params;
  
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