import 'server-only';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';

// The publish gate, ported from edge8-web (entities/campaigns/lib/blog-publish.ts,
// blog-version.ts, blog-live-edit.ts). The editor, the daily cron and the
// assistant's run_validation_checks all use this file, so they cannot disagree
// about what may go live.

export const POST_STATUSES = ['idea', 'drafted', 'approved', 'scheduled', 'published', 'skipped'] as const;
export type PostStatus = (typeof POST_STATUSES)[number];
export const STATUS_LABEL: Record<PostStatus, string> = {
  idea: 'Idea',
  drafted: 'Drafted',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
  skipped: 'Skipped',
};

export const POST_SELECT =
  'id, owner_id, brand_id, campaign_id, pillar_id, status, slug, title, title_tag, meta_description, excerpt, primary_keyword, body_md, faqs, tags, read_minutes, hero_image_url, og_image_url, featured, scheduled_for, published_at, approved_version, approved_at, updated_at';

export type PostRow = {
  id: string;
  owner_id: string;
  brand_id: string;
  campaign_id: string | null;
  pillar_id: string | null;
  status: PostStatus;
  slug: string;
  title: string;
  title_tag: string | null;
  meta_description: string | null;
  excerpt: string | null;
  primary_keyword: string | null;
  body_md: string;
  faqs: unknown;
  tags: string[];
  read_minutes: number | null;
  hero_image_url: string | null;
  og_image_url: string | null;
  featured: boolean;
  scheduled_for: string | null;
  published_at: string | null;
  approved_version: string | null;
  approved_at: string | null;
  updated_at: string;
};

export type VersionParts = Pick<PostRow, 'slug' | 'title' | 'title_tag' | 'meta_description' | 'excerpt' | 'body_md' | 'faqs' | 'hero_image_url' | 'og_image_url'>;

// What was approved: everything a reader of the live page would see.
export function postVersion(p: VersionParts): string {
  const parts = [p.slug, p.title, p.title_tag, p.meta_description, p.excerpt, p.body_md, p.faqs ?? [], p.hero_image_url, p.og_image_url];
  return createHash('sha256').update(JSON.stringify(parts)).digest('hex');
}

const MIN_WORDS = 600;
const MIN_INTERNAL_LINKS = 2;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const INTERNAL_LINK = /href="(?:https?:\/\/(?:www\.)?davehajdu\.com)?\/blog\/([a-z0-9-]+)/g;

export const readableText = (md: string) =>
  md
    .split('\n')
    .filter((l) => !l.startsWith('::'))
    .join('\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*`>_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const wordCount = (md: string) => {
  const text = readableText(md);
  return text ? text.split(' ').length : 0;
};

function foundBanned(text: string, banned: string[]): string[] {
  const hay = text.toLowerCase();
  return banned.filter((word) => {
    const w = word.trim().toLowerCase();
    if (!w) return false;
    if (!/^[\p{L}\p{N} ]+$/u.test(w)) return hay.includes(w);
    return new RegExp(`(^|[^\\p{L}\\p{N}])${w}($|[^\\p{L}\\p{N}])`, 'u').test(hay);
  });
}

export type GateCheck = { key: string; label: string; ok: boolean; detail?: string };

// Pure, and reports every failure at once.
export function runGate(p: VersionParts, banned: string[], slugTaken: boolean): GateCheck[] {
  const words = wordCount(p.body_md);
  const links = new Set([...p.body_md.matchAll(INTERNAL_LINK)].map((m) => m[1]).filter((s) => s !== p.slug)).size;
  const bannedHits = foundBanned([p.title, p.title_tag ?? '', p.meta_description ?? '', p.excerpt ?? '', readableText(p.body_md)].join('\n'), banned);
  const slugOk = SLUG.test(p.slug);
  return [
    { key: 'words', label: `${MIN_WORDS}+ words`, ok: words >= MIN_WORDS, detail: `${words} words` },
    { key: 'hero', label: 'Hero image', ok: !!p.hero_image_url },
    { key: 'slug', label: 'Valid, unused slug', ok: slugOk && !slugTaken, detail: !slugOk ? 'Use lowercase words and hyphens' : slugTaken ? 'Another post has this slug' : p.slug },
    { key: 'title_tag', label: 'Title tag', ok: !!p.title_tag?.trim() },
    { key: 'meta', label: 'Meta description', ok: !!p.meta_description?.trim() },
    { key: 'links', label: `${MIN_INTERNAL_LINKS}+ links to other posts`, ok: links >= MIN_INTERNAL_LINKS, detail: `${links} found` },
    { key: 'banned', label: 'No banned words', ok: bannedHits.length === 0, detail: bannedHits.length ? bannedHits.join(', ') : undefined },
  ];
}

export const gatePassed = (checks: GateCheck[]) => checks.every((c) => c.ok);

export const failures = (checks: GateCheck[]) => checks.filter((c) => !c.ok).map((c) => (c.detail ? `${c.label}: ${c.detail}` : c.label));

export async function checkPost(db: SupabaseClient, p: PostRow): Promise<GateCheck[]> {
  const [profile, clash] = await Promise.all([
    db.from('brand_profiles').select('banned_words').eq('brand_id', p.brand_id).maybeSingle(),
    db.from('posts').select('id').eq('brand_id', p.brand_id).eq('slug', p.slug).neq('id', p.id).limit(1),
  ]);
  if (profile.error) throw new Error(profile.error.message);
  if (clash.error) throw new Error(clash.error.message);
  return runGate(p, (profile.data?.banned_words as string[] | undefined) ?? [], (clash.data ?? []).length > 0);
}

// A live page must show a version someone approved, so a published post's
// content cannot change in place. Unpublish, edit, approve, publish.
export const LIVE_EDIT_REFUSAL = 'This post is live, so its content is locked. Unpublish it, edit it, then approve and publish it again.';

export function liveEditRefusal(current: PostRow, next: VersionParts): string | null {
  return current.status === 'published' && postVersion(current) !== postVersion(next) ? LIVE_EDIT_REFUSAL : null;
}

type Actor = 'owner' | 'assistant' | 'cron';

export async function audit(db: SupabaseClient, p: Pick<PostRow, 'id' | 'owner_id'>, actor: Actor, action: string, version?: string, reason?: string) {
  const { error } = await db.from('post_audit').insert({ post_id: p.id, owner_id: p.owner_id, actor, action, version: version ?? null, reason: reason ?? null });
  if (error) throw new Error(error.message);
}

export async function loadPost(db: SupabaseClient, id: string): Promise<PostRow> {
  const { data, error } = await db.from('posts').select(POST_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Post not found');
  return data as unknown as PostRow;
}

// Every public surface that lists or renders a post.
export function revalidateBlog(slug: string) {
  revalidatePath(`/blog/${slug}`);
  revalidatePath('/blog');
  revalidatePath('/');
  revalidatePath('/sitemap.xml');
  revalidatePath('/llms.txt');
}

async function verifyLive(url: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store', redirect: 'follow' });
      if (res.ok) return true;
    } catch {
      // transient; retry
    }
    await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
  }
  return false;
}

export type PublishResult = { ok: true; url: string; verified: boolean } | { ok: false; errors: string[] };

// Never throws for a gate problem: the cron has to carry on to the next post.
export async function publishPost(db: SupabaseClient, id: string, actor: Actor): Promise<PublishResult> {
  const p = await loadPost(db, id);
  if (p.status !== 'approved' && p.status !== 'scheduled') return { ok: false, errors: ['Only an approved post can be published.'] };
  const version = postVersion(p);
  if (p.approved_version !== version) return { ok: false, errors: ['This post changed after it was approved. Approve this version first.'] };
  const checks = await checkPost(db, p);
  if (!gatePassed(checks)) return { ok: false, errors: failures(checks) };

  const { data, error } = await db
    .from('posts')
    .update({ status: 'published', published_at: p.published_at ?? new Date().toISOString(), scheduled_for: null })
    .eq('id', id)
    .eq('status', p.status)
    .select('id');
  if (error) return { ok: false, errors: [error.message] };
  if (!data?.length) return { ok: false, errors: ['The post changed while publishing. Nothing was published.'] };
  await audit(db, p, actor, 'publish', version);
  revalidateBlog(p.slug);

  const { data: brand } = await db.from('brands').select('site_url').eq('id', p.brand_id).maybeSingle();
  const site = ((brand?.site_url as string | null) || 'https://www.davehajdu.com').replace(/\/$/, '');
  const url = `${site}/blog/${p.slug}`;
  return { ok: true, url, verified: await verifyLive(url) };
}
