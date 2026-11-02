import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { formatDate, formatValue, isPeriod, periodLabel, shiftPeriod } from '@/lib/life/metrics';
import { EO_MERPS, EO_SECTIONS, GOAL_STATUSES, renderEoMarkdown, type AutoSummary, type EoUpdate } from '@/lib/life/review';
import { createReview, finishReview, redraftReview, reopenReview, saveReview } from './actions';
import CopyEoButton from './CopyEoButton';

// Drafting calls Claude, which can take a minute.
export const maxDuration = 300;

const input = 'w-full text-sm border border-border rounded-lg px-3 py-1.5 text-navy bg-white';
const label = 'block text-xs font-semibold text-muted mb-1';

// Selected status pill: life.css ok/warn/pink tones.
const STATUS_STYLE = {
  green: 'has-checked:bg-[var(--life-ok-bg)] has-checked:text-[var(--life-ok-ink)] has-checked:border-transparent',
  yellow: 'has-checked:bg-[var(--life-warn-bg)] has-checked:text-[var(--life-warn-ink)] has-checked:border-transparent',
  red: 'has-checked:bg-[var(--life-pink-bg)] has-checked:text-[var(--life-pink-ink)] has-checked:border-transparent',
} as const;

// The few numbers worth seeing next to the update, in this order.
const STRIP = ['whoop_recovery', 'whoop_sleep_hours', 'whoop_hrv_ms', 'whoop_strain', 'workouts', 'steps', 'weight_kg'];

export default async function ReviewPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();
  const { supabase } = await requireOwner();

  const { data: review } = await supabase
    .from('reviews')
    .select('id, period, status, auto_summary, entry_id, eo')
    .eq('period', period)
    .maybeSingle();

  if (!review) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={`${periodLabel(period)} update`} />
        <EmptyState>
          No update for this month yet. Claude drafts it automatically on the 1st.
          <form action={createReview} className="mt-4">
            <input type="hidden" name="period" value={period} />
            <button type="submit" className={primaryButtonClass}>Draft it now</button>
          </form>
        </EmptyState>
      </div>
    );
  }

  const eo = (review.eo ?? {}) as EoUpdate;
  const summary = (review.auto_summary ?? {}) as AutoSummary;
  const done = review.status === 'done';
  const prevPeriod = shiftPeriod(period, -1);
  const lastGoals = [...(eo.last_goals ?? []), { title: '', status: '' as const }];

  // A month with a forum update you wrote shows it, until Claude drafts what came after it.
  const hasDraft = !!(eo.drafted_at || eo.edited_at);
  const imported =
    review.entry_id && !hasDraft
      ? ((await supabase.from('entries').select('title, body_md').eq('id', review.entry_id).maybeSingle()).data as { title: string | null; body_md: string } | null)
      : null;

  const strip = STRIP.flatMap((slug) => {
    const m = (summary.metrics ?? []).find((x) => x.slug === slug && x.value !== null);
    return m ? [{ name: m.name.replace(' (Whoop)', ''), value: formatValue(m.value!, m.unit === 'count' ? null : m.unit) }] : [];
  });
  if (summary.journal && summary.journal.value > 0) strip.push({ name: 'Journal entries', value: String(summary.journal.value) });
  if (summary.places?.trips.length) strip.push({ name: 'Nights away', value: String(summary.places.nights_away) });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={`${periodLabel(period)} update`}
        subtitle={
          imported
            ? 'Imported from your forum update'
            : eo.edited_at
              ? 'Your edits'
              : eo.drafted_at
                ? `Drafted by Claude from your data${eo.since ? ` since your ${formatDate(eo.since)} forum update` : ''}. Fix what is wrong, then finish.`
                : undefined
        }
        actions={
          <>
            <Chip tone={done ? 'mint' : 'gray'}>{done ? 'Done' : 'Draft'}</Chip>
            <CopyEoButton markdown={renderEoMarkdown(eo)} />
            {done ? (
              <form action={reopenReview}>
                <input type="hidden" name="review_id" value={review.id} />
                <input type="hidden" name="period" value={period} />
                <button type="submit" className={buttonClass}>Reopen</button>
              </form>
            ) : (
              <button type="submit" form="review-form" formAction={finishReview} className={primaryButtonClass}>
                Finish
              </button>
            )}
          </>
        }
      />

      <div className="flex gap-3 text-xs font-semibold mb-4">
        <Link href={`/life/review/${prevPeriod}`} className="text-blue">‹ {periodLabel(prevPeriod, 'short')}</Link>
        <Link href={`/life/review/${shiftPeriod(period, 1)}`} className="text-blue">{periodLabel(shiftPeriod(period, 1), 'short')} ›</Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {imported ? (
          <Card title={imported.title ?? 'Forum update'} className="lg:col-span-3">
            <div className="text-sm text-body-text whitespace-pre-wrap">{imported.body_md}</div>
          </Card>
        ) : (
          <form id="review-form" action={saveReview} className="lg:col-span-3 space-y-4">
            <input type="hidden" name="review_id" value={review.id} />
            <input type="hidden" name="period" value={period} />

            <Card title="Merps">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {EO_MERPS.map(([key, name]) => (
                  <label key={key} className="block">
                    <span className={label}>{name}</span>
                    <input name={`merp_${key}`} defaultValue={eo.merps?.[key] ?? ''} className={input} maxLength={40} />
                  </label>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <label className="block">
                  <span className={label}>Struggle</span>
                  <input name="struggle" defaultValue={eo.struggle ?? ''} className={input} />
                </label>
                <label className="block">
                  <span className={label}>Success</span>
                  <input name="success" defaultValue={eo.success ?? ''} className={input} />
                </label>
              </div>
            </Card>

            {EO_SECTIONS.map(([key, name]) => {
              const u = eo.updates?.[key];
              return (
                <Card key={key} title={name}>
                  <div className="grid gap-2">
                    <label className="block">
                      <span className={label}>Feelings</span>
                      <input name={`feelings_${key}`} defaultValue={u?.feelings ?? ''} className={input} />
                    </label>
                    <label className="block">
                      <span className={label}>Headline</span>
                      <input name={`headline_${key}`} defaultValue={u?.headline ?? ''} className={input} />
                    </label>
                    <label className="block">
                      <span className={label}>Impact</span>
                      <textarea name={`impact_${key}`} defaultValue={u?.impact ?? ''} rows={5} className={input} />
                    </label>
                  </div>
                </Card>
              );
            })}

            <Card title="Last 30 day goals">
              <div className="grid gap-2">
                {lastGoals.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input name="last_title" defaultValue={g.title} placeholder={i === lastGoals.length - 1 ? 'Add a goal' : undefined} className={input} />
                    <div className="flex gap-1 shrink-0">
                      {GOAL_STATUSES.map((st) => (
                        <label
                          key={st}
                          className={`cursor-pointer text-xs font-semibold px-2 py-1 rounded-full border border-border text-muted capitalize ${STATUS_STYLE[st]}`}
                        >
                          <input type="radio" name={`last_status_${i}`} value={st} defaultChecked={g.status === st} className="sr-only" />
                          {st}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Next 30 day goals">
              <div className="grid gap-2">
                <label className="block">
                  <span className={label}>Personal</span>
                  <input name="next_personal" defaultValue={eo.next_goals?.personal ?? ''} className={input} />
                </label>
                <label className="block">
                  <span className={label}>Business</span>
                  <input name="next_business" defaultValue={eo.next_goals?.business ?? ''} className={input} />
                </label>
              </div>
            </Card>

            <div className="flex gap-2">
              <button type="submit" className={primaryButtonClass}>Save</button>
              {!done && (
                <button type="submit" formAction={finishReview} className={buttonClass}>
                  Save and finish
                </button>
              )}
            </div>
          </form>
        )}

        <div className="lg:col-span-2 space-y-4">
          <Card title="This month in numbers">
            {strip.length === 0 ? (
              <p className="text-sm text-muted">No numbers for this month yet.</p>
            ) : (
              <dl className="grid grid-cols-2 gap-3">
                {strip.map((s) => (
                  <div key={s.name}>
                    <dt className="text-xs text-muted">{s.name}</dt>
                    <dd className="text-lg font-bold text-navy">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}
            {summary.places?.trips.length ? (
              <p className="text-xs text-body-text mt-3">{summary.places.trips.map((t) => t.title).join(', ')}</p>
            ) : null}
          </Card>

          {imported ? (
            <Card title="What came after">
              <p className="text-sm text-body-text mb-3">Have Claude draft a new update from everything since this forum update.</p>
              <form action={redraftReview}>
                <input type="hidden" name="period" value={period} />
                <button type="submit" className={buttonClass}>Draft with Claude</button>
              </form>
            </Card>
          ) : (
            !done && (
              <Card title="Start over">
                <p className="text-sm text-body-text mb-3">Have Claude draft this month again from your latest data. This replaces what is in the form.</p>
                <form action={redraftReview}>
                  <input type="hidden" name="period" value={period} />
                  <button type="submit" className={buttonClass}>Redraft with Claude</button>
                </form>
              </Card>
            )
          )}
        </div>
      </div>
    </div>
  );
}
