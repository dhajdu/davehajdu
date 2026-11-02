import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { EmptyState, PageHeader } from '@/components/life/ui';
import { formatDate, getAreas } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'EO updates', robots: { index: false, follow: false } };

type Update = { id: string; entry_date: string; title: string | null };
type Review = { id: string; entry_id: string; one_word: string | null };
type Score = { review_id: string; area_id: string; score: number | string | null };

const EO_ORDER = ['body', 'mind', 'money', 'people', 'work'];
const EO_LABEL: Record<string, string> = { body: 'Physical', mind: 'Mental', money: 'Financial', people: 'Friends & family', work: 'Professional' };

// The forum updates, separate from the journal and the month-end review.
export default async function EoPage() {
  const { supabase } = await requireOwner();
  const [updatesRes, areas] = await Promise.all([
    supabase.from('entries').select('id, entry_date, title').eq('kind', 'eo_update').order('entry_date', { ascending: false }),
    getAreas(supabase),
  ]);
  if (updatesRes.error) throw new Error(updatesRes.error.message);
  const updates = (updatesRes.data ?? []) as Update[];
  const ids = updates.map((u) => u.id);
  const { data: reviews } = ids.length ? await supabase.from('reviews').select('id, entry_id, one_word').in('entry_id', ids) : { data: [] };
  const rev = (reviews ?? []) as Review[];
  const { data: scores } = rev.length ? await supabase.from('review_scores').select('review_id, area_id, score').in('review_id', rev.map((r) => r.id)) : { data: [] };
  const areaSlug = new Map(areas.map((a) => [a.id, a.slug]));
  const byEntry = new Map(rev.map((r) => [r.entry_id, r]));
  const scoreMap = new Map<string, Record<string, number>>();
  for (const s of (scores ?? []) as Score[]) {
    if (s.score === null) continue;
    const slug = areaSlug.get(s.area_id);
    if (!slug) continue;
    scoreMap.set(s.review_id, { ...(scoreMap.get(s.review_id) ?? {}), [slug]: Number(s.score) });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="EO updates" subtitle="Forum updates, scores and presentations, kept apart from the journal" />
      {updates.length === 0 ? (
        <EmptyState>No EO updates synced yet.</EmptyState>
      ) : (
        <ul className="life-list">
          {updates.map((u) => {
            const r = byEntry.get(u.id);
            const sc = r ? scoreMap.get(r.id) : undefined;
            return (
              <li key={u.id}>
                <Link href={`/life/eo/${u.id}`}>
                  <span className="text-sm font-semibold text-navy w-28 shrink-0">{formatDate(u.entry_date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="flex-1 min-w-0 text-sm text-body-text truncate">
                    {u.title}
                    {r?.one_word ? <span className="text-muted"> · {r.one_word}</span> : null}
                  </span>
                  {sc && (
                    <span className="life-eo-scores" aria-label="Scores">
                      {EO_ORDER.map((slug) => (
                        <span key={slug} title={EO_LABEL[slug]} className={sc[slug] === undefined ? 'is-empty' : sc[slug] >= 7 ? 'is-good' : sc[slug] <= 4 ? 'is-low' : ''}>
                          {sc[slug] ?? '–'}
                        </span>
                      ))}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
