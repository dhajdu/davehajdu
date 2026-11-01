import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { METRIC_COLUMNS, formatDate, formatValue, getAreas, isPeriod, periodEnd, periodLabel, periodStart, shiftPeriod, type MetricDef } from '@/lib/life/metrics';
import { renderEoMarkdown, type AutoSummary, type AutoSummaryMetric } from '@/lib/life/review';
import { addGoal, createReview, finishReview, reopenReview, saveReview, setGoalStatus } from './actions';
import CopyEoButton from './CopyEoButton';

type ScoreRow = { area_id: string; score: number | string | null; feelings: string | null; headline: string | null; impact: string | null };
type GoalRow = {
  id: string;
  area_id: string;
  title: string;
  horizon: string;
  metric_id: string | null;
  target_value: number | string | null;
  due_on: string | null;
  status: 'open' | 'hit' | 'missed' | 'dropped';
  review_id: string | null;
};

const input = 'w-full text-sm border border-border rounded-lg px-3 py-1.5 text-navy bg-white';
const label = 'block text-xs font-semibold text-muted mb-1';

function change(m: AutoSummaryMetric) {
  if (m.value === null) return null;
  const parts: string[] = [];
  const d = (ref: number | null, name: string) => {
    if (ref === null) return;
    const diff = m.value! - ref;
    parts.push(`${diff > 0 ? '▲' : diff < 0 ? '▼' : '='}${formatValue(Math.abs(diff), m.unit === 'count' ? null : m.unit)} ${name}`);
  };
  d(m.prev, 'vs last month');
  d(m.avg12, 'vs 12-mo avg');
  return parts.join(', ');
}

const statusTone = { open: 'gray', hit: 'mint', missed: 'magenta', dropped: 'gray' } as const;

export default async function ReviewPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = await params;
  if (!isPeriod(period)) notFound();
  const { supabase } = await requireOwner();

  const { data: review } = await supabase
    .from('reviews')
    .select('id, period, one_word, headline, status, auto_summary, entry_id')
    .eq('period', period)
    .maybeSingle();

  if (!review) {
    return (
      <div className="max-w-3xl">
        <PageHeader title={`${periodLabel(period)} review`} />
        <EmptyState>
          No review for this month yet. The draft is built automatically on the 1st.
          <form action={createReview} className="mt-4">
            <input type="hidden" name="period" value={period} />
            <button type="submit" className={primaryButtonClass}>Start it now</button>
          </form>
        </EmptyState>
      </div>
    );
  }

  const prevPeriod = shiftPeriod(period, -1);
  const [areas, scoresRes, metricsRes, prevReviewRes, goalsRes] = await Promise.all([
    getAreas(supabase),
    supabase.from('review_scores').select('area_id, score, feelings, headline, impact').eq('review_id', review.id),
    supabase.from('metrics').select(METRIC_COLUMNS).order('name'),
    supabase.from('reviews').select('id').eq('period', prevPeriod).maybeSingle(),
    supabase.from('goals').select('id, area_id, title, horizon, metric_id, target_value, due_on, status, review_id').order('due_on'),
  ]);

  const scores = new Map(((scoresRes.data ?? []) as ScoreRow[]).map((s) => [s.area_id, s]));
  const metrics = (metricsRes.data ?? []) as MetricDef[];
  const metricById = new Map(metrics.map((m) => [m.id, m]));
  const areaById = new Map(areas.map((a) => [a.id, a]));
  const prevReviewId = prevReviewRes.data?.id as string | undefined;
  const allGoals = (goalsRes.data ?? []) as GoalRow[];
  const from = periodStart(period);
  const to = periodEnd(period);
  const lastMonthGoals = allGoals.filter(
    (g) => g.review_id !== review.id && ((prevReviewId && g.review_id === prevReviewId) || (g.due_on && g.due_on >= from && g.due_on <= to))
  );
  const newGoals = allGoals.filter((g) => g.review_id === review.id);

  const summary = (review.auto_summary ?? {}) as AutoSummary;
  const done = review.status === 'done';

  const markdown = renderEoMarkdown({
    period,
    oneWord: review.one_word,
    headline: review.headline,
    scores: Object.fromEntries(
      areas.map((a) => {
        const s = scores.get(a.id);
        return [a.slug, s ? { score: s.score === null ? null : Number(s.score), feelings: s.feelings, headline: s.headline, impact: s.impact } : undefined];
      })
    ),
    goals: newGoals.filter((g) => g.status !== 'dropped').map((g) => ({ title: g.title, horizon: g.horizon })),
  });

  // Auto-filled panels, one per area with something to say.
  const panels = areas
    .map((a) => {
      const lines: string[] = [];
      for (const m of summary.metrics ?? []) {
        if (m.area !== a.slug || m.value === null) continue;
        const c = change(m);
        lines.push(`${m.name} ${formatValue(m.value, m.unit)}${c ? ` (${c})` : ''}`);
      }
      if (a.slug === 'mind' && summary.journal && summary.journal.value > 0 && !(summary.metrics ?? []).some((m) => m.slug === 'journal_entries' && m.value !== null)) {
        const j = summary.journal;
        lines.push(`${j.value} journal ${j.value === 1 ? 'entry' : 'entries'}${j.avg12 !== null ? ` (12-mo avg ${formatValue(j.avg12)})` : ''}`);
      }
      if (a.slug === 'places' && summary.places) {
        const t = summary.places.trips;
        lines.push(t.length ? `${t.map((x) => x.title).join(', ')} · ${summary.places.nights_away} nights away` : 'No trips');
      }
      for (const r of (summary.records ?? []).filter((r) => r.area === a.slug)) lines.push(`${r.title} (${r.kind})`);
      const highlight = summary.highlights?.[a.slug];
      return { area: a, lines, highlight };
    })
    .filter((p) => p.lines.length || p.highlight);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={`${periodLabel(period)} review`}
        subtitle={review.entry_id ? 'Imported from an EO update' : undefined}
        actions={
          <>
            <Chip tone={done ? 'mint' : 'gray'}>{done ? 'Done' : 'Draft'}</Chip>
            <CopyEoButton markdown={markdown} />
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
        <form id="review-form" action={saveReview} className="lg:col-span-3 space-y-4">
          <input type="hidden" name="review_id" value={review.id} />
          <input type="hidden" name="period" value={period} />

          <Card title="Scores · you set these">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {areas.map((a) => {
                const s = scores.get(a.id);
                return (
                  <label key={a.id} className="block">
                    <span className={label}>{a.name}</span>
                    <input
                      type="number"
                      name={`score_${a.id}`}
                      min={0}
                      max={10}
                      step={0.5}
                      inputMode="decimal"
                      defaultValue={s?.score === null || s?.score === undefined ? '' : Number(s.score)}
                      className={`${input} text-center font-bold`}
                    />
                  </label>
                );
              })}
            </div>
          </Card>

          <Card>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block">
                <span className={label}>One word</span>
                <input name="one_word" defaultValue={review.one_word ?? ''} className={input} maxLength={40} />
              </label>
              <label className="block sm:col-span-2">
                <span className={label}>Headline</span>
                <input name="headline" defaultValue={review.headline ?? ''} placeholder="What defined this month" className={input} />
              </label>
            </div>
          </Card>

          <Card title="By area">
            <div className="divide-y divide-border">
              {areas.map((a) => {
                const s = scores.get(a.id);
                const filled = !!(s?.headline || s?.feelings || s?.impact);
                return (
                  <details key={a.id} className="py-2" open={filled}>
                    <summary className="cursor-pointer text-sm font-semibold text-navy">
                      {a.name}
                      {s?.headline ? <span className="font-normal text-muted"> · {s.headline}</span> : null}
                    </summary>
                    <div className="grid gap-2 mt-2">
                      <label className="block">
                        <span className={label}>Headline</span>
                        <input name={`headline_${a.id}`} defaultValue={s?.headline ?? ''} className={input} />
                      </label>
                      <label className="block">
                        <span className={label}>Feelings</span>
                        <textarea name={`feelings_${a.id}`} defaultValue={s?.feelings ?? ''} rows={2} className={input} />
                      </label>
                      <label className="block">
                        <span className={label}>Impact</span>
                        <textarea name={`impact_${a.id}`} defaultValue={s?.impact ?? ''} rows={2} className={input} />
                      </label>
                    </div>
                  </details>
                );
              })}
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

        <div className="lg:col-span-2 space-y-4">
          <Card title="Auto-filled from your data">
            {panels.length === 0 ? (
              <p className="text-sm text-muted">
                {summary.generated_at ? 'No data for this month.' : 'Not generated yet. The draft runs on the 1st of the month.'}
              </p>
            ) : (
              <ul className="space-y-3">
                {panels.map((p) => (
                  <li key={p.area.id}>
                    <p className="text-sm font-semibold text-navy">{p.area.name}</p>
                    {p.lines.map((l, i) => (
                      <p key={i} className="text-xs text-body-text">{l}</p>
                    ))}
                    {p.highlight && <p className="text-xs text-body-text mt-1 italic">{p.highlight}</p>}
                  </li>
                ))}
              </ul>
            )}
            {summary.generated_at && (
              <p className="text-xs text-muted mt-3">
                Generated {new Date(summary.generated_at).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            )}
          </Card>

          <Card title="Last month's goals">
            {lastMonthGoals.length === 0 ? (
              <p className="text-sm text-muted">No goals were set for this month.</p>
            ) : (
              <ul className="space-y-3">
                {lastMonthGoals.map((g) => (
                  <li key={g.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-navy">{g.title}</span>
                      <Chip tone={statusTone[g.status]}>{g.status}</Chip>
                    </div>
                    <GoalMeta g={g} metric={g.metric_id ? metricById.get(g.metric_id) : undefined} area={areaById.get(g.area_id)?.name} />
                    <div className="flex gap-1 mt-1">
                      {(['hit', 'missed', 'dropped'] as const)
                        .filter((s) => s !== g.status)
                        .map((s) => (
                          <form key={s} action={setGoalStatus}>
                            <input type="hidden" name="goal_id" value={g.id} />
                            <input type="hidden" name="period" value={period} />
                            <input type="hidden" name="status" value={s} />
                            <button type="submit" className="text-xs text-blue font-semibold px-1">Mark {s}</button>
                          </form>
                        ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Next 30 and 60 days">
            {newGoals.length > 0 && (
              <ul className="space-y-2 mb-4">
                {newGoals.map((g) => (
                  <li key={g.id} className="text-sm">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-navy">{g.title}</span>
                      <Chip>{g.horizon}</Chip>
                    </div>
                    <GoalMeta g={g} metric={g.metric_id ? metricById.get(g.metric_id) : undefined} area={areaById.get(g.area_id)?.name} />
                  </li>
                ))}
              </ul>
            )}
            <form action={addGoal} className="grid gap-2">
              <input type="hidden" name="review_id" value={review.id} />
              <input type="hidden" name="period" value={period} />
              <input name="title" required placeholder="Add a goal" className={input} />
              <div className="grid grid-cols-2 gap-2">
                <select name="area_id" required className={input} defaultValue="">
                  <option value="" disabled>Area</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <select name="horizon" className={input} defaultValue="30d">
                  <option value="30d">30 days</option>
                  <option value="60d">60 days</option>
                </select>
                <select name="metric_id" className={input} defaultValue="">
                  <option value="">No metric</option>
                  {metrics.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}{m.unit ? ` (${m.unit})` : ''}</option>
                  ))}
                </select>
                <input name="target_value" type="number" step="any" inputMode="decimal" placeholder="Target" className={input} />
              </div>
              <div>
                <button type="submit" className={buttonClass}>Add goal</button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GoalMeta({ g, metric, area }: { g: GoalRow; metric?: MetricDef; area?: string }) {
  const parts = [area, g.due_on ? `due ${formatDate(g.due_on)}` : null];
  if (metric && g.target_value !== null) parts.push(`${metric.name} target ${formatValue(Number(g.target_value), metric.unit)}`);
  return <p className="text-xs text-muted">{parts.filter(Boolean).join(' · ')}</p>;
}
