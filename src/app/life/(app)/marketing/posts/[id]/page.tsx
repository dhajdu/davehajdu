import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { StatusChip } from '@/components/life/marketing/PostChip';
import { addDays, formatDate, ictToday } from '@/lib/life/metrics';
import { ictDate } from '@/lib/blog/marketing';
import { POST_SELECT, checkPost, gatePassed, postVersion, type PostRow } from '@/lib/blog/publish';
import { approvePost, publishNow, savePost, schedulePost, setStage, unpublishPost, unschedulePost, uploadHero } from '../../actions';

export const metadata: Metadata = { title: 'Post', robots: { index: false, follow: false } };

const label = 'grid gap-1 text-xs font-semibold text-muted';

function IdButton({ id, action, children, primary, extra }: { id: string; action: (fd: FormData) => Promise<void>; children: React.ReactNode; primary?: boolean; extra?: Record<string, string> }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {Object.entries(extra ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className={primary ? 'life-btn is-primary w-full' : 'life-btn w-full'}>{children}</button>
    </form>
  );
}

export default async function PostPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ published?: string }> }) {
  const { supabase } = await requireOwner();
  const { id } = await params;
  const { published } = await searchParams;
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle();
  if (error?.code === '22P02' || !data) notFound();
  const p = data as unknown as PostRow;
  const [pillarsRes, campaignsRes, auditRes, checks] = await Promise.all([
    supabase.from('post_pillars').select('id, name').eq('brand_id', p.brand_id).order('sort'),
    supabase.from('campaigns').select('id, name').eq('brand_id', p.brand_id).order('created_at', { ascending: false }),
    supabase.from('post_audit').select('id, actor, action, reason, created_at').eq('post_id', p.id).order('created_at', { ascending: false }).limit(8),
    checkPost(supabase, p),
  ]);
  const ready = gatePassed(checks);
  const live = p.status === 'published';
  const approvedHere = (p.status === 'approved' || p.status === 'scheduled') && p.approved_version === postVersion(p);
  const short = (ts: string) => formatDate(ictDate(ts), { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-6xl">
      <PageHeader title={p.title} eyebrow="Post" actions={<Link className="life-btn" href="/life/marketing/calendar">Calendar</Link>} />

      {published === 'verified' && <p className="life-card text-sm mb-4">Published. The live page responded.</p>}
      {published === 'unverified' && <p className="life-card text-sm mb-4">Published, but the live page did not respond yet. Check it in a minute.</p>}

      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <Card>
          {live && <p className="text-sm text-muted mb-3">This post is live, so its content is locked. Unpublish it to edit the words, slug or images.</p>}
          <form action={savePost} className="grid gap-3">
            <input type="hidden" name="id" value={p.id} />
            <fieldset disabled={live} className="grid gap-3 min-w-0">
              <label className={label}>Title<input name="title" required defaultValue={p.title} /></label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={label}>Slug<input name="slug" required defaultValue={p.slug} /></label>
                <label className={label}>Title tag<input name="title_tag" maxLength={60} defaultValue={p.title_tag ?? ''} /></label>
              </div>
              <label className={label}>Meta description<textarea name="meta_description" rows={2} defaultValue={p.meta_description ?? ''} /></label>
              <label className={label}>Excerpt<textarea name="excerpt" rows={2} defaultValue={p.excerpt ?? ''} /></label>
              <label className={label}>Body (markdown, inline HTML allowed)<textarea name="body_md" rows={24} className="font-mono" defaultValue={p.body_md} /></label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className={label}>Hero image URL<input name="hero_image_url" type="url" defaultValue={p.hero_image_url ?? ''} /></label>
                <label className={label}>Share image URL<input name="og_image_url" type="url" defaultValue={p.og_image_url ?? ''} /></label>
              </div>
            </fieldset>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className={label}>Pillar
                <select name="pillar_id" defaultValue={p.pillar_id ?? ''}>
                  <option value="">No pillar</option>
                  {(pillarsRes.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label className={label}>Campaign
                <select name="campaign_id" defaultValue={p.campaign_id ?? ''}>
                  <option value="">No campaign</option>
                  {(campaignsRes.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                </select>
              </label>
              <label className={label}>Primary keyword<input name="primary_keyword" defaultValue={p.primary_keyword ?? ''} /></label>
              <label className={label}>Tags, comma separated<input name="tags" defaultValue={p.tags.join(', ')} /></label>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" defaultChecked={p.featured} /> Featured</label>
            <SaveButton className="life-btn is-primary justify-self-start" />
          </form>
        </Card>

        <div className="grid gap-4 min-w-0">
          <Card title="Status">
            <div className="flex items-center gap-2 mb-3">
              <StatusChip status={p.status} />
              {p.scheduled_for && <span className="text-xs text-muted">{short(p.scheduled_for)}, 8am</span>}
              {live && p.published_at && <span className="text-xs text-muted">{short(p.published_at)}</span>}
            </div>
            <div className="grid gap-2">
              {p.status === 'idea' && <IdButton id={p.id} action={setStage} extra={{ stage: 'drafted' }} primary>Mark as drafted</IdButton>}
              {p.status === 'drafted' && (
                <form action={approvePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className="life-btn is-primary w-full" disabled={!ready}>Approve this version</button>
                </form>
              )}
              {approvedHere && <IdButton id={p.id} action={publishNow} primary>Publish now</IdButton>}
              {p.status === 'approved' && approvedHere && (
                <form action={schedulePost} className="flex gap-2">
                  <input type="hidden" name="id" value={p.id} />
                  <input type="date" name="date" required min={addDays(ictToday(), 1)} aria-label="Publish date" className="flex-1 min-w-0" />
                  <button type="submit" className="life-btn">Schedule</button>
                </form>
              )}
              {p.status === 'scheduled' && <IdButton id={p.id} action={unschedulePost}>Unschedule</IdButton>}
              {(p.status === 'drafted' || p.status === 'approved' || p.status === 'scheduled') && <IdButton id={p.id} action={setStage} extra={{ stage: 'idea' }}>Back to idea</IdButton>}
              {p.status !== 'published' && p.status !== 'skipped' && <IdButton id={p.id} action={setStage} extra={{ stage: 'skipped' }}>Skip</IdButton>}
              {p.status === 'skipped' && <IdButton id={p.id} action={setStage} extra={{ stage: 'idea' }}>Restore</IdButton>}
              {live && <IdButton id={p.id} action={unpublishPost}>Unpublish to edit</IdButton>}
              {live && <a className="life-btn" href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">View live page</a>}
            </div>
          </Card>

          <Card title="Publish gate">
            <ul className="grid gap-2">
              {checks.map((c) => (
                <li key={c.key} className="flex items-start justify-between gap-3 text-sm">
                  <span className={c.ok ? 'text-navy' : 'font-semibold text-magenta'}>{c.ok ? '✓' : '✗'} {c.label}</span>
                  {c.detail && <span className="text-xs text-muted text-right min-w-0 break-words">{c.detail}</span>}
                </li>
              ))}
            </ul>
          </Card>

          {!live && (
            <Card title="Hero image">
              {p.hero_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.hero_image_url} alt="" className="w-full rounded-lg border border-border mb-3" />
              )}
              <form action={uploadHero} className="grid gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input type="file" name="file" accept="image/*" required aria-label="Hero image file" />
                <SaveButton className="life-btn">Upload</SaveButton>
              </form>
            </Card>
          )}

          <Card title="History">
            {(auditRes.data ?? []).length === 0 ? (
              <p className="text-sm text-muted">No changes recorded yet.</p>
            ) : (
              <ul className="grid gap-2">
                {(auditRes.data ?? []).map((a) => (
                  <li key={a.id} className="text-xs text-muted">
                    <span className="font-semibold text-navy">{a.action.replaceAll('_', ' ')}</span> by {a.actor}, {short(a.created_at)}
                    {a.reason && <span className="block">{a.reason}</span>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
