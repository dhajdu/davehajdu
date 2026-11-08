// One-time import of the hard-coded posts (src/lib/posts-data.ts) into dave-life:
//   node scripts/blog/import-posts.ts            dry run: checks every body converts and back
//   node scripts/blog/import-posts.ts --write    upserts brand, pillars and posts
// Needs NEXT_PUBLIC_LIFE_SUPABASE_URL, LIFE_SUPABASE_SECRET_KEY, LIFE_OWNER_EMAIL.
// Idempotent on (brand_id, slug). Deleted with posts-data.ts once the import was
// verified; it stays in git history.
import * as nodeModule from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if (spec.startsWith('.') && !/\.[cm]?[jt]s$/.test(spec) && ctx.parentURL) {
      const u = new URL(spec + '.ts', ctx.parentURL);
      if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
    }
    return next(spec, ctx);
  },
});
const { POSTS, BLOCKS_BY_SLUG, FAQS_BY_SLUG } = await import('../../src/lib/posts-data');
const { parseBody, toMarkdown } = await import('../../src/lib/blog/body');

// SEO overrides that lived in src/app/blog/[slug]/page.tsx.
const TITLE_TAGS: Record<string, string> = {
  'ai-officer-mindset': 'AI Officer Mindset: Learning to Results in 12 Hours',
  'entrepreneurial-learnings': '18 Entrepreneurial Learnings from Tough Markets',
  'fire-horse-2026': 'Year of the Fire Horse 2026: Week One Lessons',
  'supabase-for-non-technical-founders': 'Supabase for Non-Technical Founders',
  'leverage-yourself-first': 'How Founders Should Use AI: The Infinite Leverage Math',
  'tore-up-my-website': "Four AI Metrics That Prove You're Leading AI, Not Just Using It",
};
const META_DESCRIPTIONS: Record<string, string> = {
  'leverage-yourself-first':
    "How founders should use AI: the math most people get wrong. AI multiplies the version of you running it. Here's the 90-day proof.",
  'tore-up-my-website':
    'Most founders track AI tools, not AI outcomes. Here are the four AI metrics I rebuilt my consulting business around after one Verne Harnish talk in Manila.',
};

const PILLARS = [
  { slug: 'ai-in-business', name: 'AI In Business', sort: 1 },
  { slug: 'high-performance-culture', name: 'High Performance Culture', sort: 2 },
  { slug: 'branding-with-ai', name: 'Branding with AI', sort: 3 },
];

// Posts keep their list order: same-day posts are a minute apart, earlier in the list = newer.
function publishedAt(date: string, index: number): string {
  const day = new Date(`${date} 12:00 UTC`);
  if (Number.isNaN(day.getTime())) throw new Error(`Bad date: ${date}`);
  return new Date(day.getTime() - index * 60_000).toISOString();
}

let failed = 0;
const rows = POSTS.map((p, i) => {
  const blocks = BLOCKS_BY_SLUG[p.slug] ?? [];
  const body_md = toMarkdown(blocks);
  if (!isDeepStrictEqual(parseBody(body_md), blocks)) {
    failed++;
    const back = parseBody(body_md);
    const at = back.findIndex((b, j) => !isDeepStrictEqual(b, blocks[j]));
    console.error(`✗ ${p.slug}: block ${at} differs`, blocks[at], back[at]);
  }
  const pillar = PILLARS.find((x) => x.name === p.category);
  if (!pillar) throw new Error(`No pillar for category ${p.category}`);
  return {
    slug: p.slug,
    title: p.title,
    title_tag: TITLE_TAGS[p.slug] ?? null,
    meta_description: META_DESCRIPTIONS[p.slug] ?? null,
    excerpt: p.excerpt,
    body_md,
    faqs: FAQS_BY_SLUG[p.slug] ?? [],
    tags: p.tags,
    read_minutes: parseInt(p.readTime, 10),
    hero_image_url: p.image ?? null,
    og_image_url: p.ogImage ?? null,
    featured: p.featured ?? false,
    day_number: p.dayNumber ?? null,
    status: 'published',
    published_at: publishedAt(p.date, i),
    pillarSlug: pillar.slug,
  };
});

for (let i = 1; i < rows.length; i++) {
  if (rows[i].published_at >= rows[i - 1].published_at) throw new Error(`Posts out of date order at ${rows[i].slug}`);
}
console.log(`${rows.length} posts, ${rows.length - failed} convert losslessly`);
if (failed) process.exit(1);
if (!process.argv.includes('--write')) process.exit(0);

const { createClient } = await import('@supabase/supabase-js');
const db = createClient(process.env.NEXT_PUBLIC_LIFE_SUPABASE_URL!, process.env.LIFE_SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
const email = process.env.LIFE_OWNER_EMAIL?.toLowerCase();
const { data: users, error: usersError } = await db.auth.admin.listUsers({ perPage: 50 });
if (usersError) throw usersError;
const owner_id = users.users.find((u) => u.email?.toLowerCase() === email)?.id;
if (!owner_id) throw new Error('Owner not found');

const { data: brand, error: brandError } = await db
  .from('brands')
  .upsert({ owner_id, slug: 'dave-hajdu', name: 'Dave Hajdu', site_url: 'https://www.davehajdu.com' }, { onConflict: 'slug' })
  .select('id')
  .single();
if (brandError) throw brandError;

const { data: pillars, error: pillarError } = await db
  .from('post_pillars')
  .upsert(PILLARS.map((p) => ({ ...p, owner_id, brand_id: brand.id })), { onConflict: 'brand_id,slug' })
  .select('id, slug');
if (pillarError) throw pillarError;

const { error: postError } = await db.from('posts').upsert(
  rows.map(({ pillarSlug, ...r }) => ({ ...r, owner_id, brand_id: brand.id, pillar_id: pillars.find((x) => x.slug === pillarSlug)!.id })),
  { onConflict: 'brand_id,slug' }
);
if (postError) throw postError;
console.log(`Wrote ${rows.length} posts to brand dave-hajdu`);
