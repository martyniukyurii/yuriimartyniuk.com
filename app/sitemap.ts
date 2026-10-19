import { MetadataRoute } from 'next';

import Post from '@/app/models/Post';
import { connectToDatabase } from '@/lib/mongodb';
import { SITE_URL, localizedUrl } from '@/lib/seo';

// Оновлюємо карту сайту раз на годину, щоб нові пости потрапляли в пошук
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Головна має окрему адресу для кожної мови
  const routes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 1,
      alternates: {
        languages: {
          uk: localizedUrl('/', 'uk'),
          en: localizedUrl('/', 'en'),
        },
      },
    },
  ];

  try {
    await connectToDatabase();
    const posts = await Post.find({ deleted: { $ne: true } }).select('slug date').sort({ date: -1 }).lean();

    for (const post of posts) {
      routes.push({
        url: `${SITE_URL}/blog/${encodeURIComponent(post.slug)}`,
        lastModified: new Date(post.date).toISOString(),
        changeFrequency: 'yearly',
        priority: 0.7,
      });
    }
  } catch (error) {
    console.error('Sitemap: failed to load posts', error);
  }

  return routes;
}
