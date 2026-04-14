import type { MetadataRoute } from 'next';
import { POSTS } from '@/lib/posts-data';

const BASE = 'https://www.davehajdu.com';

export default function sitemap(): MetadataRoute.Sitemap {
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

  const postRoutes = POSTS.map((post) => ({
    url: `${BASE}/blog/${post.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
