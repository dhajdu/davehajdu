import type { MetadataRoute } from 'next';
import { listPosts } from '@/lib/blog/posts';

const BASE = 'https://www.davehajdu.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes = [
    '',
    '/ai-in-business',
    '/blog',
    '/books',
    '/speaker-topics',
    '/book-keynote',
    '/schedule-consultation',
  ].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1.0 : 0.8,
  }));

  const postRoutes = (await listPosts()).map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
