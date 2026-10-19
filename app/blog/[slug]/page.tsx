import type { Metadata } from 'next';

import BlogPostClient from '@/components/blog/blog-post-client';
import { getPost } from '@/lib/posts';

export const dynamic = 'force-dynamic';

// Пост написаний однією мовою, тому canonical без ?lang=
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug).catch(() => null);
  if (!post) return { title: 'Blog', robots: { index: false } };

  const description = (post.excerpt || post.text || '').replace(/\s+/g, ' ').trim().slice(0, 160);
  const image = post.media?.find((item: { type: string; url?: string }) => item.type === 'photo' && item.url)?.url;
  const canonical = `/blog/${encodeURIComponent(post.slug)}`;

  return {
    title: post.title || description.slice(0, 60),
    description,
    alternates: { canonical },
    openGraph: {
      type: 'article',
      url: canonical,
      title: post.title,
      description,
      publishedTime: post.date,
      ...(image && { images: [image] }),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // Read the database directly, without making an HTTP call to localhost.
  const post = await getPost(slug);
  return <BlogPostClient post={post} />;
}
