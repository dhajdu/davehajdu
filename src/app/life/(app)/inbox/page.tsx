import { requireOwner } from '@/lib/life/auth';
import { PageHeader, Chip, EmptyState, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { approveItem, rejectItem } from './actions';

type Item = {
  id: string;
  kind: string;
  reason: string;
  confidence: number | null;
  proposed: { action?: string; table?: string; values?: Record<string, unknown> } | null;
  created_at: string;
  areas: { name: string; sort_order: number } | null;
  source_items: { payload: Record<string, unknown> | null } | null;
};

function show(v: unknown): string {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function Values({ values }: { values: Record<string, unknown> }) {
  const rows = Object.entries(values).filter(([k, v]) => k !== 'owner_id' && show(v) !== '');
  if (!rows.length) return null;
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm mt-2">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-muted">{k.replace(/_/g, ' ')}</dt>
          <dd className="text-navy break-words min-w-0">{show(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

export default async function InboxPage() {
  const { supabase } = await requireOwner();
  const { data, error } = await supabase
    .from('review_queue')
    .select('id, kind, reason, confidence, proposed, created_at, areas(name, sort_order), source_items(payload)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const items = (data ?? []) as unknown as Item[];
  const groups = new Map<string, { order: number; items: Item[] }>();
  for (const item of items) {
    const name = item.areas?.name ?? 'Unsorted';
    const g = groups.get(name) ?? { order: item.areas?.sort_order ?? 999, items: [] };
    g.items.push(item);
    groups.set(name, g);
  }
  const sorted = [...groups.entries()].sort((a, b) => a[1].order - b[1].order);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Inbox" subtitle={`${items.length} waiting on a decision`} />
      {error && <p className="text-sm text-magenta mb-4">{error.message}</p>}
      {!items.length && <EmptyState>Nothing waiting. Claude will ask here when it is unsure.</EmptyState>}

      <div className="space-y-8">
        {sorted.map(([area, g]) => (
          <section key={area}>
            <h2 className="text-xs font-semibold text-muted mb-3">{area}</h2>
            <div className="space-y-3">
              {g.items.map((item) => {
                const payload = item.source_items?.payload;
                const subject = show(payload?.subject);
                const from = show(payload?.from);
                return (
                  <article key={item.id} className="border border-border rounded-xl p-4 bg-white">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Chip>{item.kind}</Chip>
                      {item.confidence !== null && <span className="text-xs text-muted">{Math.round(Number(item.confidence) * 100)}% confident</span>}
                      {item.proposed?.table && <span className="text-xs text-muted">{item.proposed.action} {item.proposed.table}</span>}
                    </div>
                    <p className="text-sm font-semibold text-navy">{item.reason}</p>
                    {item.proposed?.values && <Values values={item.proposed.values} />}

                    {(subject || from) && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-blue text-xs font-semibold">View source</summary>
                        <div className="mt-2 rounded-lg bg-light-gray p-3 space-y-1">
                          {subject && <p><span className="text-muted">Subject </span><span className="text-navy">{subject}</span></p>}
                          {from && <p><span className="text-muted">From </span><span className="text-navy">{from}</span></p>}
                        </div>
                      </details>
                    )}

                    <div className="flex flex-wrap gap-2 mt-4">
                      <form action={rejectItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className={buttonClass}>Reject</button>
                      </form>
                      <form action={approveItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button type="submit" className={primaryButtonClass}>Approve</button>
                      </form>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
