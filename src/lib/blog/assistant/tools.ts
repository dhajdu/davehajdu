import 'server-only';
import { lifeAdmin } from '@/lib/life/supabase-admin';
import { addDays, ictToday } from '@/lib/life/metrics';
import { BRAND } from '@/lib/blog/marketing';
import { failures, gatePassed, runGate, type VersionParts } from '@/lib/blog/publish';

// Tools for the marketing assistant. Every query runs through
// marketing_assistant_run as the marketing_assistant role, so Postgres limits
// it to its brand's posts and refuses anything past drafted (migration
// 20261109010000_marketing_assistant.sql). The SQL is fixed here; the model
// only supplies arguments, passed as the jsonb $1. There is no approve,
// schedule or publish tool.

type Args = Record<string, unknown>;
type Schema = { type: 'object'; properties: Record<string, unknown>; required?: string[]; additionalProperties: false };
export type Tool = { name: string; description: string; inputSchema: Schema; write?: boolean; run: (args: Args) => Promise<unknown> };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function q(sql: string, args: Args = {}): Promise<Record<string, unknown>[]> {
  const { data, error } = await lifeAdmin.rpc('marketing_assistant_run', { q: sql, args, brand: BRAND });
  if (error) throw new Error(error.message);
  return (data ?? []) as Record<string, unknown>[];
}

function schema(properties: Record<string, unknown> = {}, required: string[] = []): Schema {
  return { type: 'object', properties, required, additionalProperties: false };
}

function slugOf(v: unknown): string {
  if (typeof v !== 'string' || !SLUG.test(v)) throw new Error('slug must be lowercase words and hyphens');
  return v;
}

function text(v: unknown, name: string, max: number): string | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v !== 'string' || v.length > max) throw new Error(`${name} must be text of at most ${max} characters`);
  return v;
}

const FIELDS = {
  title: { type: 'string' },
  title_tag: { type: 'string', description: 'SEO title, 60 characters or fewer.' },
  meta_description: { type: 'string' },
  excerpt: { type: 'string' },
  primary_keyword: { type: 'string' },
  body_md: { type: 'string', description: 'Markdown blocks separated by blank lines. Inline HTML links only: <a href="/blog/other-post">text</a>.' },
  pillar_id: { type: 'string', description: 'From list_pillars.' },
  tags: { type: 'array', items: { type: 'string' } },
  status: { type: 'string', enum: ['idea', 'drafted'] },
};

// Validates the writable fields and works out the read time.
function draftFields(a: Args): Args {
  const out: Args = {};
  for (const [key, max] of [['title', 300], ['title_tag', 60], ['meta_description', 320], ['excerpt', 600], ['primary_keyword', 120], ['body_md', 100_000]] as const) {
    const v = text(a[key], key, max);
    if (v !== undefined) out[key] = v;
  }
  if (a.pillar_id !== undefined) {
    if (typeof a.pillar_id !== 'string' || !UUID.test(a.pillar_id)) throw new Error('pillar_id must come from list_pillars');
    out.pillar_id = a.pillar_id;
  }
  if (a.tags !== undefined) {
    if (!Array.isArray(a.tags) || a.tags.some((t) => typeof t !== 'string')) throw new Error('tags must be a list of text');
    out.tags = a.tags;
  }
  if (a.status !== undefined) {
    if (a.status !== 'idea' && a.status !== 'drafted') throw new Error('The assistant can only set idea or drafted');
    out.status = a.status;
  }
  if (typeof out.body_md === 'string') out.read_minutes = Math.max(1, Math.ceil(out.body_md.split(/\s+/).length / 200));
  return out;
}

const TAGS_JSON = `(select coalesce(array_agg(x), '{}') from jsonb_array_elements_text($1->'tags') x)`;
const SETTABLE = `id, slug, title, status, updated_at`;

async function getPost(slug: string) {
  const rows = await q(
    `select id, status, slug, title, title_tag, meta_description, excerpt, primary_keyword, body_md, faqs, tags, read_minutes, hero_image_url, og_image_url, pillar_id, updated_at
     from posts where slug = $1->>'slug'`,
    { slug }
  );
  if (!rows.length) throw new Error(`No post with slug ${slug}`);
  return rows[0];
}

async function generateHero(prompt: string): Promise<{ bytes: Buffer; mime: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/nano-banana-pro-preview:generateContent', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '16:9' } },
    }),
  });
  if (!res.ok) throw new Error(`Image model returned ${res.status}`);
  const json = (await res.json()) as { candidates?: { content?: { parts?: { inlineData?: { data: string; mimeType: string } }[] } }[] };
  const part = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part?.inlineData) throw new Error('The image model returned no image');
  return { bytes: Buffer.from(part.inlineData.data, 'base64'), mime: part.inlineData.mimeType };
}

export const TOOLS: Tool[] = [
  {
    name: 'get_brand_profile',
    description: 'How this brand writes: voice, audience, rules and banned words. Read it before drafting.',
    inputSchema: schema(),
    run: () => q(`select b.name, b.site_url, p.voice, p.audience, p.rules, p.banned_words from brands b left join brand_profiles p on p.brand_id = b.id`),
  },
  {
    name: 'list_posts',
    description: 'Posts for this brand, newest change first. Optionally filter by status.',
    inputSchema: schema({ status: { type: 'string', enum: ['idea', 'drafted', 'approved', 'scheduled', 'published', 'skipped'] }, limit: { type: 'number' } }),
    run: (a) =>
      q(
        `select id, slug, title, status, excerpt, scheduled_for, published_at, updated_at from posts
         where ($1->>'status') is null or status = $1->>'status' order by updated_at desc limit ($1->>'limit')::int`,
        { status: a.status ?? null, limit: Math.min(Math.max(1, Number(a.limit) || 25), 100) }
      ),
  },
  {
    name: 'get_post',
    description: 'One post in full, by slug.',
    inputSchema: schema({ slug: { type: 'string' } }, ['slug']),
    run: (a) => getPost(slugOf(a.slug)),
  },
  {
    name: 'list_pillars',
    description: "This brand's content themes.",
    inputSchema: schema(),
    run: () => q(`select id, slug, name, description from post_pillars order by sort`),
  },
  {
    name: 'create_draft',
    description: 'Create a new post as an idea or a draft. Dave approves and publishes; this tool cannot.',
    write: true,
    inputSchema: schema({ slug: { type: 'string' }, ...FIELDS, reason: { type: 'string', description: 'Why this post.' } }, ['slug', 'title']),
    async run(a) {
      const fields = draftFields(a);
      if (!fields.title) throw new Error('A draft needs a title');
      const rows = await q(
        `insert into posts (brand_id, slug, title, status, title_tag, meta_description, excerpt, primary_keyword, body_md, pillar_id, tags, read_minutes)
         values (marketing_assistant_brand(), $1->>'slug', $1->>'title', coalesce($1->>'status', 'drafted'), $1->>'title_tag', $1->>'meta_description', $1->>'excerpt',
           $1->>'primary_keyword', coalesce($1->>'body_md', ''), ($1->>'pillar_id')::uuid, ${TAGS_JSON}, ($1->>'read_minutes')::int)
         returning ${SETTABLE}`,
        { slug: slugOf(a.slug), ...fields, _audit: 'assistant_create', reason: text(a.reason, 'reason', 500) ?? null }
      );
      return rows[0];
    },
  },
  {
    name: 'update_draft',
    description: 'Change a post that is still an idea or a draft. A reason is required and recorded. Anything past drafted is refused.',
    write: true,
    inputSchema: schema({ slug: { type: 'string' }, reason: { type: 'string' }, ...FIELDS }, ['slug', 'reason']),
    async run(a) {
      const reason = text(a.reason, 'reason', 500)?.trim();
      if (!reason) throw new Error('A reason is required');
      const fields = draftFields(a);
      const rows = await q(
        `update posts set
           title = coalesce($1->>'title', title), title_tag = coalesce($1->>'title_tag', title_tag),
           meta_description = coalesce($1->>'meta_description', meta_description), excerpt = coalesce($1->>'excerpt', excerpt),
           primary_keyword = coalesce($1->>'primary_keyword', primary_keyword), body_md = coalesce($1->>'body_md', body_md),
           pillar_id = coalesce(($1->>'pillar_id')::uuid, pillar_id), status = coalesce($1->>'status', status),
           read_minutes = coalesce(($1->>'read_minutes')::int, read_minutes),
           tags = case when $1 ? 'tags' then ${TAGS_JSON} else tags end
         where slug = $1->>'slug' returning ${SETTABLE}`,
        { slug: slugOf(a.slug), ...fields, _audit: 'assistant_update', reason }
      );
      if (!rows.length) throw new Error('No idea or draft with that slug. Posts past drafted cannot be changed.');
      return rows[0];
    },
  },
  {
    name: 'run_validation_checks',
    description: 'Run the publish gate on a post and list what is missing. Read only.',
    inputSchema: schema({ slug: { type: 'string' } }, ['slug']),
    async run(a) {
      const slug = slugOf(a.slug);
      const [post, profile] = await Promise.all([getPost(slug), q(`select banned_words from brand_profiles`)]);
      const checks = runGate(post as unknown as VersionParts, (profile[0]?.banned_words as string[] | undefined) ?? [], false);
      return { passed: gatePassed(checks), missing: failures(checks), checks };
    },
  },
  {
    name: 'generate_hero_image',
    description: 'Generate a hero image for an idea or draft and set it on the post. Pass a brief describing a simple picture of the idea.',
    write: true,
    inputSchema: schema({ slug: { type: 'string' }, brief: { type: 'string' } }, ['slug', 'brief']),
    async run(a) {
      const slug = slugOf(a.slug);
      const brief = text(a.brief, 'brief', 1000);
      if (!brief) throw new Error('A brief is required');
      const post = await getPost(slug);
      if (post.status !== 'idea' && post.status !== 'drafted') throw new Error('Posts past drafted cannot be changed.');

      const prompt = `A realistic top-down photograph of a white paper napkin on a light gray table. On it, a quick hand-drawn sketch in navy ballpoint with one magenta marker accent: ${brief}. No logos, faces or extra text. No cream or beige tones.`;
      const { bytes, mime } = await generateHero(prompt);
      const ext = mime.split('/')[1] ?? 'png';
      const path = `${slug}/hero-${Date.now()}.${ext}`;
      const upload = await lifeAdmin.storage.from('blog').upload(path, bytes, { contentType: mime });
      if (upload.error) throw new Error(upload.error.message);
      const url = lifeAdmin.storage.from('blog').getPublicUrl(path).data.publicUrl;

      await q(`insert into post_images (post_id, url, storage_path, prompt, is_hero) values (($1->>'id')::uuid, $1->>'url', $1->>'path', $1->>'prompt', true) returning id`, { id: post.id, url, path, prompt });
      const rows = await q(`update posts set hero_image_url = $1->>'url' where slug = $1->>'slug' returning ${SETTABLE}`, { slug, url, _audit: 'assistant_hero_image', reason: brief });
      if (!rows.length) throw new Error('Posts past drafted cannot be changed.');
      return { ...rows[0], hero_image_url: url };
    },
  },
  {
    name: 'suggest_from_journal',
    description: "Dave's journal days in a date range, as raw material for post ideas. Journal days only; at most 31 days.",
    inputSchema: schema({ from: { type: 'string', description: 'YYYY-MM-DD. Defaults to 7 days ago.' }, to: { type: 'string', description: 'YYYY-MM-DD. Defaults to today.' } }),
    run(a) {
      const today = ictToday();
      const to = typeof a.to === 'string' && DATE.test(a.to) ? a.to : today;
      const from = typeof a.from === 'string' && DATE.test(a.from) ? a.from : addDays(to, -7);
      if (from < addDays(to, -31)) throw new Error('At most 31 days at a time');
      return q(`select entry_date, title, fields, body_md from entries where kind = 'journal' and entry_date between ($1->>'from')::date and ($1->>'to')::date order by entry_date desc`, { from, to });
    },
  },
];
