import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { Markdown } from '@/components/life/Markdown';
import { getMonthReview, gradeTone } from '@/lib/life/month-review';
import { formatValue, isPeriod, periodLabel, shiftPeriod } from '@/lib/life/metrics';
import { saveMonthReview } from '../actions';

export const metadata: Metadata = { title: 'Review', robots: { index: false, follow: false } };

const input = 'w-full text-sm';
const label = 'block text-xs font-semibold text-muted mb-1';

export default async function MonthReviewPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();
  const { supabase } = await requireOwner();

  const [review, autoRes] = await Promise.all([
    getMonthReview(supabase, period),
    supabase.from('reviews').select('auto_summary').eq('period', period).maybeSingle(),
  ]);
  type Auto = { metrics?: { slug: string; name: string; unit: string | null; value: number | null; prev: number | null }[]; highlights?: Record<string, string> };
  const auto = ((autoRes.data as { auto_summary: Auto | null } | null)?.auto_summary ?? null) as Auto | null;
  const monthName = periodLabel(period, 'long').split(' ')[0];
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const numbers = (auto?.metrics ?? []).filter((m) => m.value !== null);

  return (
    <div className="max-w-3xl">
      <PageHeader
        eyebrow={`Monthly review · ${periodLabel(period)}`}
        title={review?.headline ?? `${monthName}, honestly`}
        subtitle={review?.summary ?? undefined}
        actions={
          <div className="flex items-center gap-2">
            {review && <Chip tone={review.status === 'done' ? 'mint' : 'gray'}>{review.status === 'done' ? 'Done' : 'Draft'}</Chip>}
            <Link href={`/life/review/${prev}`} className={buttonClass} aria-label="Previous month">‹</Link>
            <Link href={`/life/review/${next}`} className={buttonClass} aria-label="Next month">›</Link>
          </div>
        }
      />

      {review ? (
        <div className="space-y-5">
          <section className="life-grades">
            <div className={`life-grade is-${gradeTone(review.grade_health)}`}>
              <span className="life-grade-letter">{review.grade_health ?? '–'}</span>
              <span className="life-grade-label">Health</span>
            </div>
            <div className={`life-grade is-${gradeTone(review.grade_business)}`}>
              <span className="life-grade-letter">{review.grade_business ?? '–'}</span>
              <span className="life-grade-label">Business</span>
            </div>
            <p className="life-grades-note">Health is the priority, so it is graded first. The gap between the two grades is the lesson for next month.</p>
          </section>

          <Card title="Health, top priority" className="life-review-health">
            <Markdown lines={review.health_md.split('\n')} />
          </Card>

          <Card title="Business, what I actually did">
            <Markdown lines={review.business_md.split('\n')} />
          </Card>

          <Card title={`${periodLabel(next, 'long').split(' ')[0]}, the moves, health first`}>
            <Markdown lines={review.moves_md.split('\n')} />
            {review.numbers.length > 0 && (
              <div className="life-numbers">
                {review.numbers.map((n) => (
                  <span key={n} className="life-number-chip">{n}</span>
                ))}
              </div>
            )}
          </Card>

          {review.closing && <p className="life-review-close">{review.closing}</p>}
        </div>
      ) : (
        <div className="space-y-5">
          <Card title="Material">
            {numbers.length === 0 ? (
              <p className="text-sm text-muted">No numbers gathered for this month yet. The draft runs on the 1st.</p>
            ) : (
              <ul className="life-goals">
                {numbers.map((m) => (
                  <li key={m.slug} className="life-goal">
                    <span className="life-goal-text">
                      {m.name} {formatValue(m.value, m.unit)}
                      {m.prev !== null ? <span className="text-muted"> · last month {formatValue(m.prev, m.unit)}</span> : null}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {auto?.highlights && Object.keys(auto.highlights).length > 0 && (
              <div className="mt-3 space-y-2">
                {Object.entries(auto.highlights).map(([area, text]) => (
                  <p key={area} className="text-xs text-body-text"><b className="text-navy">{area}</b> · {text}</p>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <details className="life-card mt-5" open={!review}>
        <summary className="cursor-pointer text-sm font-semibold text-navy">{review ? 'Edit this review' : `Write the ${monthName} review`}</summary>
        <form action={saveMonthReview} className="grid gap-3 mt-4">
          <input type="hidden" name="period" value={period} />
          <div className="grid sm:grid-cols-[1fr_90px_90px] gap-3">
            <label className="block">
              <span className={label}>Headline</span>
              <input name="headline" defaultValue={review?.headline ?? `${monthName}, honestly`} maxLength={200} className={input} />
            </label>
            <label className="block">
              <span className={label}>Health grade</span>
              <input name="grade_health" defaultValue={review?.grade_health ?? ''} maxLength={3} placeholder="C+" className={`${input} text-center font-bold`} />
            </label>
            <label className="block">
              <span className={label}>Business grade</span>
              <input name="grade_business" defaultValue={review?.grade_business ?? ''} maxLength={3} placeholder="A-" className={`${input} text-center font-bold`} />
            </label>
          </div>
          <label className="block">
            <span className={label}>Summary, two sentences</span>
            <textarea name="summary" defaultValue={review?.summary ?? ''} rows={2} className={input} />
          </label>
          <label className="block">
            <span className={label}>Health: what you set, what you logged, the honest read (markdown)</span>
            <textarea name="health_md" defaultValue={review?.health_md ?? ''} rows={8} className={input} />
          </label>
          <label className="block">
            <span className={label}>Business: what got done, what was missed (markdown)</span>
            <textarea name="business_md" defaultValue={review?.business_md ?? ''} rows={8} className={input} />
          </label>
          <label className="block">
            <span className={label}>Next month&apos;s moves, health first (numbered list)</span>
            <textarea name="moves_md" defaultValue={review?.moves_md ?? ''} rows={6} className={input} />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className={label}>Targets, one per line</span>
              <textarea name="numbers" defaultValue={review?.numbers.join('\n') ?? ''} rows={3} className={input} />
            </label>
            <label className="block">
              <span className={label}>Closing line</span>
              <textarea name="closing" defaultValue={review?.closing ?? ''} rows={3} className={input} />
            </label>
          </div>
          <div className="flex gap-2">
            <button type="submit" name="status" value="draft" className={buttonClass}>Save draft</button>
            <button type="submit" name="status" value="done" className={primaryButtonClass}>Save and finish</button>
          </div>
        </form>
      </details>
    </div>
  );
}
