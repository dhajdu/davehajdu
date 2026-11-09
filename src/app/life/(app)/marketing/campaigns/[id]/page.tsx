import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { StatusChip } from '@/components/life/marketing/PostChip';
import { formatDate } from '@/lib/life/metrics';
import { ictDate } from '@/lib/blog/marketing';
import type { PostStatus } from '@/lib/blog/publish';
import { createPost, saveCampaign } from '../../actions';

export const metadata: Metadata = { title: 'Campaign', robots: { index: false, follow: false } };

type Row = { id: string; title: string; status: PostStatus; scheduled_for: string | null; published_at: string | null };

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireOwner();
  const { id } = await params;
  const [campaignRes, postsRes, pillarsRes] = await Promise.all([
    supabase.from('campaigns').select('id, name, goal, pillar_id, starts_on, ends_on, status, notes').eq('id', id).maybeSingle(),
    supabase.from('posts').select('id, title, status, scheduled_for, published_at').eq('campaign_id', id).order('created_at'),
    supabase.from('post_pillars').select('id, name').order('sort'),
  ]);
  if (campaignRes.error?.code === '22P02' || !campaignRes.data) notFound();
  const c = campaignRes.data;
  const posts = (postsRes.data ?? []) as Row[];

  return (
    <div className="max-w-6xl">
      <PageHeader title={c.name} eyebrow="Campaign" subtitle={c.goal ?? undefined} actions={<Link className="life-btn" href="/life/marketing/campaigns">All campaigns</Link>} />
      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Card title="Posts">
          {posts.length === 0 ? (
            <EmptyState>No posts in this campaign yet.</EmptyState>
          ) : (
            <ul className="divide-y mb-4">
              {posts.map((p) => {
                const when = p.scheduled_for ?? p.published_at;
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                    <Link href={`/life/marketing/posts/${p.id}`} className="text-sm font-semibold text-navy min-w-0 truncate hover:text-blue">{p.title}</Link>
                    <span className="flex items-center gap-2 flex-none">
                      {when && <span className="text-xs text-muted">{formatDate(ictDate(when), { month: 'short', day: 'numeric' })}</span>}
                      <StatusChip status={p.status} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <form action={createPost} className="flex gap-2 mt-3">
            <input type="hidden" name="campaign_id" value={c.id} />
            <input name="title" required placeholder="Add a post to this campaign" aria-label="New post title" className="flex-1 min-w-0" />
            <button type="submit" className="life-btn">Add</button>
          </form>
        </Card>

        <Card title="Details">
          <form action={saveCampaign} className="grid gap-3">
            <input type="hidden" name="id" value={c.id} />
            <label className="grid gap-1 text-xs font-semibold text-muted">Name<input name="name" required defaultValue={c.name} /></label>
            <label className="grid gap-1 text-xs font-semibold text-muted">Goal<textarea name="goal" rows={2} defaultValue={c.goal ?? ''} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="grid gap-1 text-xs font-semibold text-muted">Pillar
                <select name="pillar_id" defaultValue={c.pillar_id ?? ''}>
                  <option value="">No pillar</option>
                  {(pillarsRes.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">Status
                <select name="status" defaultValue={c.status}>
                  <option value="idea">Idea</option>
                  <option value="active">Active</option>
                  <option value="done">Done</option>
                </select>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-muted">Starts<input type="date" name="starts_on" defaultValue={c.starts_on ?? ''} /></label>
              <label className="grid gap-1 text-xs font-semibold text-muted">Ends<input type="date" name="ends_on" defaultValue={c.ends_on ?? ''} /></label>
            </div>
            <label className="grid gap-1 text-xs font-semibold text-muted">Notes<textarea name="notes" rows={14} defaultValue={c.notes ?? ''} /></label>
            <SaveButton className="life-btn is-primary" />
          </form>
        </Card>
      </div>
    </div>
  );
}
