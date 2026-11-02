import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { EmptyState, PageHeader } from '@/components/life/ui';
import { getMonthReviews, gradeTone } from '@/lib/life/month-review';
import { currentPeriod, periodLabel, shiftPeriod } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Review', robots: { index: false, follow: false } };

export default async function ReviewsPage() {
  const { supabase } = await requireOwner();
  const reviews = await getMonthReviews(supabase);
  const last = shiftPeriod(currentPeriod(), -1);
  const hasLast = reviews.some((r) => r.period === last);

  return (
    <div className="max-w-3xl">
      <PageHeader title="Review" subtitle="One per month. Health graded first, then business, then the moves" />

      {!hasLast && (
        <p className="text-sm text-body-text mb-4">
          No review for {periodLabel(last)} yet.{' '}
          <Link href={`/life/review/${last}`} className="font-semibold text-blue">Write it</Link>
        </p>
      )}

      {reviews.length === 0 ? (
        <EmptyState>No month-end reviews yet.</EmptyState>
      ) : (
        <ul className="life-list">
          {reviews.map((r) => (
            <li key={r.id}>
              <Link href={`/life/review/${r.period}`}>
                <span className="text-sm font-semibold text-navy w-28 shrink-0">{periodLabel(r.period, 'short')}</span>
                <span className="flex-1 min-w-0 text-sm text-body-text truncate">{r.headline ?? <span className="text-muted">No headline yet</span>}</span>
                <span className="life-grades-mini">
                  <span className={`is-${gradeTone(r.grade_health)}`} title="Health">{r.grade_health ?? '–'}</span>
                  <span className={`is-${gradeTone(r.grade_business)}`} title="Business">{r.grade_business ?? '–'}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
