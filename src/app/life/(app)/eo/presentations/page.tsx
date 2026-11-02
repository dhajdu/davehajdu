import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { Markdown } from '@/components/life/Markdown';
import { formatDate } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'EO presentations', robots: { index: false, follow: false } };

type Pres = { id: string; entry_date: string; title: string | null; body_md: string };

// The forum presentations. The same presentation rides along in several
// updates, so each title shows once, at its latest version, with the dates
// it was carried.
export default async function EoPresentationsPage() {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase.from('entries').select('id, entry_date, title, body_md').eq('kind', 'presentation').order('entry_date', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as Pres[]).filter((p) => p.body_md.trim().length > 0);
  const byTitle = new Map<string, { latest: Pres; dates: string[] }>();
  for (const p of rows) {
    const key = (p.title ?? '').trim().toLowerCase();
    const cur = byTitle.get(key);
    if (cur) cur.dates.push(p.entry_date);
    else byTitle.set(key, { latest: p, dates: [p.entry_date] });
  }
  const list = [...byTitle.values()].sort((a, b) => b.latest.entry_date.localeCompare(a.latest.entry_date));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Presentations" subtitle={`${list.length} forum presentations, latest version of each`} />
      {list.length === 0 ? (
        <EmptyState>No presentations synced yet.</EmptyState>
      ) : (
        <Card className="life-history">
          {list.map(({ latest, dates }) => (
            <details key={latest.id}>
              <summary>
                <span>{latest.title}</span>
                <span className="life-tally">
                  {formatDate(dates[dates.length - 1], { month: 'short', year: 'numeric' })}
                  {dates.length > 1 ? ` · carried ${dates.length} times` : ''}
                </span>
              </summary>
              <Markdown lines={latest.body_md.split('\n')} />
            </details>
          ))}
        </Card>
      )}
    </div>
  );
}
