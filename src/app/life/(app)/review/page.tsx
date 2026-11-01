import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Chip, EmptyState, PageHeader } from '@/components/life/ui';
import { currentPeriod, fetchAll, periodLabel, shiftPeriod } from '@/lib/life/metrics';

type ReviewRow = { id: string; period: string; one_word: string | null; status: 'draft' | 'done' };

export default async function ReviewsPage() {
  const { supabase } = await requireOwner();

  const [reviews, scores] = await Promise.all([
    fetchAll<ReviewRow>((a, b) =>
      supabase.from('reviews').select('id, period, one_word, status').order('period', { ascending: false }).range(a, b)
    ),
    fetchAll<{ review_id: string; score: number | string | null }>((a, b) =>
      supabase.from('review_scores').select('review_id, score').not('score', 'is', null).order('id').range(a, b)
    ),
  ]);

  const avg = new Map<string, number>();
  const acc = new Map<string, number[]>();
  for (const s of scores) {
    if (!acc.has(s.review_id)) acc.set(s.review_id, []);
    acc.get(s.review_id)!.push(Number(s.score));
  }
  for (const [id, vals] of acc) avg.set(id, vals.reduce((x, y) => x + y, 0) / vals.length);

  const last = shiftPeriod(currentPeriod(), -1);
  const hasLast = reviews.some((r) => r.period === last);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Reviews" subtitle="One per month, newest first" />

      {!hasLast && (
        <p className="text-sm text-body-text mb-4">
          No review for {periodLabel(last)} yet.{' '}
          <Link href={`/life/review/${last}`} className="font-semibold text-blue">Start it</Link>
        </p>
      )}

      {reviews.length === 0 ? (
        <EmptyState>No reviews yet. The first draft arrives on the 1st of the month.</EmptyState>
      ) : (
        <ul className="border border-border rounded-xl divide-y divide-border">
          {reviews.map((r) => {
            const a = avg.get(r.id);
            return (
              <li key={r.id}>
                <Link href={`/life/review/${r.period}`} className="flex items-center gap-3 px-4 py-3 hover:bg-light-gray">
                  <span className="text-sm font-semibold text-navy w-32 shrink-0">{periodLabel(r.period, 'short')}</span>
                  <span className="flex-1 min-w-0 text-sm text-body-text truncate">{r.one_word ?? <span className="text-muted">No word yet</span>}</span>
                  <span className="text-sm font-semibold text-navy w-10 text-right">{a !== undefined ? a.toFixed(1) : '-'}</span>
                  <Chip tone={r.status === 'done' ? 'mint' : 'gray'}>{r.status === 'done' ? 'Done' : 'Draft'}</Chip>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
