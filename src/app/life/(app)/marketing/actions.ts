'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { addDays, ictToday } from '@/lib/life/metrics';
import { BRAND } from '@/lib/blog/marketing';
import { audit, checkPost, failures, gatePassed, liveEditRefusal, loadPost, postVersion, publishPost, revalidateBlog, wordCount, type PostRow } from '@/lib/blog/publish';

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t === '' ? null : t;
}

const need = (fd: FormData, key: string) => {
  const v = str(fd, key);
  if (!v) throw new Error(`Missing ${key}`);
  return v;
};

function refresh(id?: string) {
  revalidatePath('/life/marketing', 'layout');
  if (id) revalidatePath(`/life/marketing/posts/${id}`);
}

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

async function brandId(supabase: Awaited<ReturnType<typeof requireOwner>>['supabase']): Promise<string> {
  const { data, error } = await supabase.from('brands').select('id').eq('slug', BRAND).single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function createPost(formData: FormData) {
  const { supabase } = await requireOwner();
  const title = need(formData, 'title');
  const slug = slugify(title);
  if (!slug) throw new Error('The title needs at least one letter or number');
  const campaignId = str(formData, 'campaign_id');
  const { data, error } = await supabase
    .from('posts')
    .insert({ brand_id: await brandId(supabase), title, slug, status: 'idea', campaign_id: campaignId })
    .select('id')
    .single();
  if (error) throw new Error(error.code === '23505' ? 'A post with that title already exists' : error.message);
  refresh();
  redirect(`/life/marketing/posts/${data.id}`);
}

export async function savePost(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const current = await loadPost(supabase, id);
  // On a live post the content fields are disabled, so the browser does not send
  // them: only the pillar, campaign, keyword and tags are being saved.
  const content = formData.has('title')
    ? {
        slug: need(formData, 'slug'),
        title: need(formData, 'title'),
        title_tag: str(formData, 'title_tag'),
        meta_description: str(formData, 'meta_description'),
        excerpt: str(formData, 'excerpt'),
        body_md: (formData.get('body_md') as string | null) ?? '',
        faqs: current.faqs,
        hero_image_url: str(formData, 'hero_image_url'),
        og_image_url: str(formData, 'og_image_url'),
      }
    : {
        slug: current.slug,
        title: current.title,
        title_tag: current.title_tag,
        meta_description: current.meta_description,
        excerpt: current.excerpt,
        body_md: current.body_md,
        faqs: current.faqs,
        hero_image_url: current.hero_image_url,
        og_image_url: current.og_image_url,
      };
  const refusal = liveEditRefusal(current, content);
  if (refusal) throw new Error(refusal);

  // An edit to an approved post needs a new approval.
  const stale = (current.status === 'approved' || current.status === 'scheduled') && postVersion(current) !== postVersion(content);
  const { error } = await supabase
    .from('posts')
    .update({
      ...content,
      primary_keyword: str(formData, 'primary_keyword'),
      pillar_id: str(formData, 'pillar_id'),
      campaign_id: str(formData, 'campaign_id'),
      tags: (str(formData, 'tags') ?? '').split(',').map((t) => t.trim()).filter(Boolean),
      featured: formData.get('featured') === 'on',
      read_minutes: Math.max(1, Math.ceil(wordCount(content.body_md) / 200)),
      ...(stale ? { status: 'drafted', approved_version: null, approved_at: null, scheduled_for: null } : {}),
    })
    .eq('id', id);
  if (error) throw new Error(error.code === '23505' ? 'Another post has that slug' : error.message);
  if (stale) await audit(supabase, current, 'owner', 'approval_cleared_by_edit');
  if (current.status === 'published') revalidateBlog(current.slug);
  refresh(id);
}

export async function setStage(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const stage = need(formData, 'stage');
  if (stage !== 'idea' && stage !== 'drafted' && stage !== 'skipped') throw new Error('Unknown stage');
  const p = await loadPost(supabase, id);
  if (p.status === 'published') throw new Error('Unpublish this post first');
  const { error } = await supabase.from('posts').update({ status: stage, approved_version: null, approved_at: null, scheduled_for: null }).eq('id', id);
  if (error) throw new Error(error.message);
  await audit(supabase, p, 'owner', `move_to_${stage}`);
  refresh(id);
}

export async function approvePost(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const p = await loadPost(supabase, id);
  if (p.status !== 'drafted') throw new Error('Only a drafted post can be approved');
  const checks = await checkPost(supabase, p);
  if (!gatePassed(checks)) throw new Error(`Not ready: ${failures(checks).join('; ')}`);
  const version = postVersion(p);
  const { error } = await supabase.from('posts').update({ status: 'approved', approved_version: version, approved_at: new Date().toISOString() }).eq('id', id).eq('status', 'drafted');
  if (error) throw new Error(error.message);
  await audit(supabase, p, 'owner', 'approve', version);
  refresh(id);
}

function assertApprovedVersion(p: PostRow) {
  if (p.status !== 'approved' && p.status !== 'scheduled') throw new Error('Approve this post first');
  if (p.approved_version !== postVersion(p)) throw new Error('This post changed after it was approved. Approve this version first.');
}

// The daily run is at 08:00 Vietnam time, so a post goes live that morning.
export async function schedulePost(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const date = need(formData, 'date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Pick a date');
  if (date < addDays(ictToday(), 1)) throw new Error('Pick a date from tomorrow on, or publish now');
  const p = await loadPost(supabase, id);
  assertApprovedVersion(p);
  const { error } = await supabase.from('posts').update({ status: 'scheduled', scheduled_for: `${date}T08:00:00+07:00` }).eq('id', id);
  if (error) throw new Error(error.message);
  await audit(supabase, p, 'owner', 'schedule', p.approved_version ?? undefined, date);
  refresh(id);
}

export async function unschedulePost(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const p = await loadPost(supabase, id);
  if (p.status !== 'scheduled') throw new Error('This post is not scheduled');
  const { error } = await supabase.from('posts').update({ status: 'approved', scheduled_for: null }).eq('id', id);
  if (error) throw new Error(error.message);
  await audit(supabase, p, 'owner', 'unschedule');
  refresh(id);
}

export async function publishNow(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const result = await publishPost(supabase, id, 'owner');
  if (!result.ok) throw new Error(result.errors.join('; '));
  refresh(id);
  redirect(`/life/marketing/posts/${id}?published=${result.verified ? 'verified' : 'unverified'}`);
}

export async function unpublishPost(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const p = await loadPost(supabase, id);
  if (p.status !== 'published') throw new Error('This post is not published');
  const { error } = await supabase.from('posts').update({ status: 'drafted', approved_version: null, approved_at: null }).eq('id', id).eq('status', 'published');
  if (error) throw new Error(error.message);
  await audit(supabase, p, 'owner', 'unpublish');
  revalidateBlog(p.slug);
  refresh(id);
}

export async function uploadHero(formData: FormData) {
  const { supabase, user } = await requireOwner();
  const id = need(formData, 'id');
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('Choose an image');
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image');
  const p = await loadPost(supabase, id);
  if (p.status === 'published') throw new Error('Unpublish this post first');

  const ext = (file.name.split('.').pop() ?? 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${p.slug}/hero-${Date.now()}.${ext}`;
  const upload = await supabase.storage.from('blog').upload(path, file, { contentType: file.type });
  if (upload.error) throw new Error(upload.error.message);
  const url = supabase.storage.from('blog').getPublicUrl(path).data.publicUrl;

  const stale = p.status === 'approved' || p.status === 'scheduled';
  const { error } = await supabase
    .from('posts')
    .update({ hero_image_url: url, ...(stale ? { status: 'drafted', approved_version: null, approved_at: null, scheduled_for: null } : {}) })
    .eq('id', id);
  if (error) throw new Error(error.message);
  const image = await supabase.from('post_images').insert({ post_id: id, owner_id: user.id, url, storage_path: path, is_hero: true });
  if (image.error) throw new Error(image.error.message);
  refresh(id);
}

function campaignFields(formData: FormData) {
  const status = str(formData, 'status') ?? 'idea';
  if (status !== 'idea' && status !== 'active' && status !== 'done') throw new Error('Unknown campaign status');
  return {
    name: need(formData, 'name'),
    goal: str(formData, 'goal'),
    pillar_id: str(formData, 'pillar_id'),
    starts_on: str(formData, 'starts_on'),
    ends_on: str(formData, 'ends_on'),
    status,
    notes: str(formData, 'notes'),
  };
}

export async function createCampaign(formData: FormData) {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({ ...campaignFields(formData), brand_id: await brandId(supabase) })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  refresh();
  redirect(`/life/marketing/campaigns/${data.id}`);
}

export async function saveCampaign(formData: FormData) {
  const { supabase } = await requireOwner();
  const id = need(formData, 'id');
  const { error } = await supabase.from('campaigns').update(campaignFields(formData)).eq('id', id);
  if (error) throw new Error(error.message);
  refresh();
}

export async function saveBrandProfile(formData: FormData) {
  const { supabase } = await requireOwner();
  const brand_id = need(formData, 'brand_id');
  const { error } = await supabase.from('brand_profiles').upsert({
    brand_id,
    voice: str(formData, 'voice'),
    audience: str(formData, 'audience'),
    rules: str(formData, 'rules'),
    banned_words: (str(formData, 'banned_words') ?? '').split('\n').map((w) => w.trim()).filter(Boolean),
  });
  if (error) throw new Error(error.message);
  refresh();
}
