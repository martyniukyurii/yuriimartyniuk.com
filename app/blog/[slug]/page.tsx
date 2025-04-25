import BlogPostClient from '@/components/blog/blog-post-client';

async function getPost(slug: string) {
  try {
    // Створюємо правильний URL з базового URL та шляху
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const url = new URL(`/api/posts/${slug}`, baseUrl);
    
    const response = await fetch(url.toString(), { 
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Не вдалося завантажити пост');
    }
    
    // Отримуємо пост з даними
    const post = await response.json();
    
    // Якщо медіа-файли існують, обробляємо їх URL для використання у клієнті
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
  } catch (error) {
    console.error('Помилка при завантаженні поста:', error);

    return null;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // Отримуємо slug з params, очікуючи вирішення промісу
  const { slug } = await params;
  
  const postData = await getPost(slug);
  
  return <BlogPostClient post={postData} />;
} 