import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader, primaryButtonClass } from '@/components/life/ui';
import { MarketingTabs } from '@/components/life/marketing/MarketingTabs';
import { StatusChip } from '@/components/life/marketing/PostChip';
import { formatDate } from '@/lib/life/metrics';
import { ictDate } from '@/lib/blog/marketing';
import { POST_STATUSES, STATUS_LABEL, type PostStatus } from '@/lib/blog/publish';
import { createPost } from './actions';

export const metadata: Metadata = { title: 'Marketing', robots: { index: false, follow: false } };

type Row = { id: string; title: string; status: PostStatus; scheduled_for: string | null; published_at: string | null; updated_at: string };

export default async function MarketingPage() {
  const { supabase } = await requireOwner();
  const [postsRes, campaignsRes] = await Promise.all([
    supabase.from('posts').select('id, title, status, scheduled_for, published_at, updated_at').order('updated_at', { ascending: false }),
    supabase.from('campaigns').select('id, name, goal, starts_on, ends_on, status').eq('status', 'active').order('starts_on'),
  ]);
  if (postsRes.error) throw new Error(postsRes.error.message);
  if (campaignsRes.error) throw new Error(campaignsRes.error.message);
  const posts = (postsRes.data ?? []) as Row[];
  const count = (s: PostStatus) => posts.filter((p) => p.status === s).length;
  const inFlight = posts.filter((p) => p.status !== 'published' && p.status !== 'skipped').slice(0, 12);
  const short = (ts: string) => formatDate(ictDate(ts), { month: 'short', day: 'numeric' });

  return (
    <div className="max-w-6xl">
      <PageHeader title="Marketing" subtitle="From idea to live, with no deploy." />
      <MarketingTabs active="overview" />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        {POST_STATUSES.map((s) => (
          <div className="life-card" key={s}>
            <div className="text-2xl font-extrabold text-navy">{count(s)}</div>
            <div className="text-xs text-muted">{STATUS_LABEL[s]}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="In progress">
          <form action={createPost} className="flex gap-2 mb-4">
            <input name="title" required placeholder="A new post idea" aria-label="New post title" className="flex-1 min-w-0" />
            <button type="submit" className={primaryButtonClass}>Add idea</button>
          </form>
          {inFlight.length === 0 ? (
            <p className="text-sm text-muted">Nothing in progress.</p>
          ) : (
            <ul className="divide-y">
              {inFlight.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                  <Link href={`/life/marketing/posts/${p.id}`} className="text-sm font-semibold text-navy min-w-0 truncate hover:text-blue">{p.title}</Link>
                  <span className="flex items-center gap-2 flex-none">
                    {p.scheduled_for && <span className="text-xs text-muted">{short(p.scheduled_for)}</span>}
                    <StatusChip status={p.status} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Active campaigns">
          {(campaignsRes.data ?? []).length === 0 ? (
            <EmptyState>No active campaigns.</EmptyState>
          ) : (
            <ul className="divide-y">
              {(campaignsRes.data ?? []).map((c) => (
                <li key={c.id} className="py-2">
                  <Link href={`/life/marketing/campaigns/${c.id}`} className="text-sm font-semibold text-navy hover:text-blue">{c.name}</Link>
                  {c.goal && <p className="text-xs text-muted mt-0.5">{c.goal}</p>}
                  {c.starts_on && c.ends_on && <p className="text-xs text-muted">{formatDate(c.starts_on, { month: 'short', day: 'numeric' })} to {formatDate(c.ends_on, { month: 'short', day: 'numeric' })}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
