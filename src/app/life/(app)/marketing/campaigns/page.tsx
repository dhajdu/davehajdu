import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader } from '@/components/life/ui';
import { SaveButton } from '@/components/life/SaveButton';
import { MarketingTabs } from '@/components/life/marketing/MarketingTabs';
import { formatDate } from '@/lib/life/metrics';
import { createCampaign } from '../actions';

export const metadata: Metadata = { title: 'Campaigns', robots: { index: false, follow: false } };

const when = (d: string) => formatDate(d, { month: 'short', day: 'numeric', year: 'numeric' });

export default async function CampaignsPage() {
  const { supabase } = await requireOwner();
  const [campaignsRes, pillarsRes] = await Promise.all([
    supabase.from('campaigns').select('id, name, goal, starts_on, ends_on, status, posts(id)').order('starts_on', { ascending: false, nullsFirst: false }),
    supabase.from('post_pillars').select('id, name').order('sort'),
  ]);
  if (campaignsRes.error) throw new Error(campaignsRes.error.message);
  const campaigns = campaignsRes.data ?? [];

  return (
    <div className="max-w-6xl">
      <PageHeader title="Campaigns" subtitle="An idea with a goal and dates that groups its posts." />
      <MarketingTabs active="campaigns" />
      <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 items-start">
        <div className="grid gap-3">
          {campaigns.length === 0 && <EmptyState>No campaigns yet.</EmptyState>}
          {campaigns.map((c) => (
            <Link key={c.id} href={`/life/marketing/campaigns/${c.id}`} className="life-card block hover:border-blue">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-base font-bold text-navy">{c.name}</h2>
                <Chip tone={c.status === 'active' ? 'mint' : 'gray'}>{c.status}</Chip>
              </div>
              {c.goal && <p className="text-sm text-muted mt-1">{c.goal}</p>}
              <p className="text-xs text-muted mt-2">
                {c.starts_on && c.ends_on ? `${when(c.starts_on)} to ${when(c.ends_on)} · ` : ''}
                {(c.posts as unknown[]).length} {(c.posts as unknown[]).length === 1 ? 'post' : 'posts'}
              </p>
            </Link>
          ))}
        </div>
        <Card title="New campaign">
          <form action={createCampaign} className="grid gap-3">
            <input name="name" required placeholder="Name" aria-label="Name" />
            <textarea name="goal" rows={2} placeholder="Goal" aria-label="Goal" />
            <select name="pillar_id" aria-label="Pillar" defaultValue="">
              <option value="">No pillar</option>
              {(pillarsRes.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" name="starts_on" aria-label="Starts" />
              <input type="date" name="ends_on" aria-label="Ends" />
            </div>
            <input type="hidden" name="status" value="idea" />
            <SaveButton className="life-btn is-primary">Create campaign</SaveButton>
          </form>
        </Card>
      </div>
    </div>
  );
}
