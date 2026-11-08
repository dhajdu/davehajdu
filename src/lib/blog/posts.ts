import 'server-only';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';

// Reads published posts for the public blog from dave-life, with the
// publishable key: row security lets anonymous readers see published posts
// only (supabase/life/migrations/20261108030000_blog_public_read.sql).

const BRAND = 'dave-hajdu';

const db = createClient(
  process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_LIFE_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key',
  { auth: { persistSession: false } }
);

export type Post = {
  slug: string;
  title: string;
  titleTag: string | null;
  metaDescription: string | null;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  image?: string;
  ogImage?: string;
  dayNumber?: number;
};

export type PostWithBody = Post & { bodyMd: string; faqs: { q: string; a: string }[] };

const LIST = 'slug, title, title_tag, meta_description, excerpt, published_at, read_minutes, tags, featured, hero_image_url, og_image_url, day_number, post_pillars(name), brands!inner(slug)';

type Row = {
  slug: string;
  title: string;
  title_tag: string | null;
  meta_description: string | null;
  excerpt: string | null;
  published_at: string;
  read_minutes: number | null;
  tags: string[];
  featured: boolean;
  hero_image_url: string | null;
  og_image_url: string | null;
  day_number: number | null;
  post_pillars: { name: string } | null;
  body_md?: string;
  faqs?: { q: string; a: string }[];
};

function toPost(r: Row): Post {
  return {
    slug: r.slug,
    title: r.title,
    titleTag: r.title_tag,
    metaDescription: r.meta_description,
    excerpt: r.excerpt ?? '',
    date: new Date(r.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    readTime: `${r.read_minutes ?? 1} min`,
    category: r.post_pillars?.name ?? '',
    tags: r.tags,
    featured: r.featured,
    image: r.hero_image_url ?? undefined,
    ogImage: r.og_image_url ?? undefined,
    dayNumber: r.day_number ?? undefined,
  };
}

// Newest first.
export const listPosts = cache(async (): Promise<Post[]> => {
  const { data, error } = await db
    .from('posts')
    .select(LIST)
    .eq('status', 'published')
    .eq('brands.slug', BRAND)
    .order('published_at', { ascending: false });
  if (error) throw new Error(`Blog posts: ${error.message}`);
  return (data as unknown as Row[]).map(toPost);
});

export const getPost = cache(async (slug: string): Promise<PostWithBody | null> => {
  const { data, error } = await db
    .from('posts')
    .select(`${LIST}, body_md, faqs`)
    .eq('status', 'published')
    .eq('brands.slug', BRAND)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`Blog post ${slug}: ${error.message}`);
  if (!data) return null;
  const row = data as unknown as Row;
  return { ...toPost(row), bodyMd: row.body_md ?? '', faqs: row.faqs ?? [] };
});
