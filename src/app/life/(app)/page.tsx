import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader, buttonClass } from '@/components/life/ui';
import {
  AREA_PHASE,
  countEntriesByMonth,
  currentPeriod,
  formatDate,
  formatValue,
  getAreas,
  getMetricSummaries,
  getMetrics,
  ictToday,
  isPeriod,
  nightsInRange,
  periodEnd,
  periodLabel,
  periodStart,
  shiftPeriod,
  summarizeCounts,
  trendTone,
  tripsOverlapping,
  type Direction,
  type MetricSummary,
} from '@/lib/life/metrics';

type Tile = { slug: string; name: string; main?: string; detail?: React.ReactNode; empty?: string };

function Trend({ delta, direction, unit, label }: { delta: number | null; direction: Direction; unit?: string | null; label: string }) {
  if (delta === null) return null;
  const tone = trendTone(delta, direction);
  const color = tone === 'better' ? 'text-blue' : tone === 'worse' ? 'text-magenta' : 'text-muted';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '=';
  return (
    <span className={color}>
      {arrow} {formatValue(Math.abs(delta), unit === 'count' ? null : unit)} {label}
    </span>
  );
}

function metricTrend(s: MetricSummary | undefined) {
  if (!s || s.value === null) return null;
  if (s.avg12 !== null) return <Trend delta={s.value - s.avg12} direction={s.metric.direction} unit={s.metric.unit} label="vs 12-mo avg" />;
  if (s.prev !== null) return <Trend delta={s.value - s.prev} direction={s.metric.direction} unit={s.metric.unit} label="vs last month" />;
  return null;
}

export default async function LifeHome({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const now = currentPeriod();
  const period = isPeriod(sp.month) ? sp.month : now;
  const from = periodStart(period);
  const to = periodEnd(period);
  const today = ictToday();

  const [areas, metrics, trips, journalCounts, goalsRes, draftRes, pendingRes, upcomingRes] = await Promise.all([
    getAreas(supabase),
    getMetrics(supabase),
    tripsOverlapping(supabase, from, to),
    countEntriesByMonth(supabase, 'journal', shiftPeriod(period, -12), period),
    supabase.from('goals').select('id, status, due_on'),
    supabase.from('reviews').select('period').eq('status', 'draft').lte('period', now).order('period', { ascending: false }).limit(1),
    supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('trips').select('id, title, start_on, end_on').gte('start_on', today).order('start_on').limit(5),
  ]);

  const summaries = await getMetricSummaries(supabase, metrics, period);
  const bySlug = new Map(summaries.map((s) => [s.metric.slug, s]));

  // Body
  const weight = bySlug.get('weight_kg');
  const workouts = bySlug.get('workouts');
  const bodyMetric = weight?.value != null ? weight : summaries.find((s) => s.value !== null && areas.find((a) => a.id === s.metric.area_id)?.slug === 'body');

  // Mind
  const journal = summarizeCounts(journalCounts, period);

  // Places
  const nights = trips.reduce((n, t) => n + nightsInRange(t, from, to), 0);

  // Direction
  const goals = (goalsRes.data ?? []) as { status: string; due_on: string | null }[];
  const dueThisMonth = goals.filter((g) => g.due_on && g.due_on >= from && g.due_on <= to);
  const openGoals = goals.filter((g) => g.status === 'open').length;

  const tiles: Tile[] = areas.map((a) => {
    const base = { slug: a.slug, name: a.name };
    const phase = AREA_PHASE[a.slug] ?? 2;
    const noSource = { ...base, empty: `No source yet · Phase ${phase}` };
    switch (a.slug) {
      case 'body':
        if (!bodyMetric || bodyMetric.value === null) return { ...base, empty: 'No data this month' };
        return {
          ...base,
          main: formatValue(bodyMetric.value, bodyMetric.metric.unit),
          detail: (
            <>
              {metricTrend(bodyMetric)}
              {workouts?.value != null && <span> · {formatValue(workouts.value)} workouts</span>}
            </>
          ),
        };
      case 'mind':
        if (journal.value === 0 && journalCounts.size === 0) return { ...base, empty: 'No journal entries yet' };
        return {
          ...base,
          main: `${journal.value} ${journal.value === 1 ? 'entry' : 'entries'}`,
          detail:
            journal.avg12 !== null ? (
              <Trend delta={Math.round((journal.value - journal.avg12) * 10) / 10} direction="higher_better" unit="count" label="vs 12-mo avg" />
            ) : undefined,
        };
      case 'places':
        return {
          ...base,
          main: `${trips.length} ${trips.length === 1 ? 'trip' : 'trips'}`,
          detail: `${nights} ${nights === 1 ? 'night' : 'nights'} away`,
        };
      case 'direction':
        if (dueThisMonth.length > 0) {
          const hit = dueThisMonth.filter((g) => g.status === 'hit').length;
          return { ...base, main: `${hit}/${dueThisMonth.length} goals`, detail: 'due this month' };
        }
        if (openGoals > 0) return { ...base, main: `${openGoals} open`, detail: 'goals' };
        return { ...base, empty: 'No goals yet · set them in a review' };
      default: {
        const s = summaries.find((x) => x.metric.area_id === a.id && x.value !== null);
        if (!s) return noSource;
        return { ...base, main: formatValue(s.value, s.metric.unit), detail: metricTrend(s) ?? s.metric.name };
      }
    }
  });

  const draft = draftRes.data?.[0]?.period as string | undefined;
  const pending = pendingRes.count ?? 0;
  const upcoming = (upcomingRes.data ?? []) as { id: string; title: string; start_on: string; end_on: string | null }[];
  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="This month"
        subtitle={periodLabel(period)}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/life?month=${prev}`} className={buttonClass} aria-label="Previous month">‹</Link>
            <form action="/life" className="flex items-center gap-2">
              <input
                type="month"
                name="month"
                defaultValue={period}
                max={now}
                className="text-xs border border-border rounded-lg px-2 py-1.5 text-navy"
                aria-label="Month"
              />
              <button type="submit" className={buttonClass}>Go</button>
            </form>
            {next <= now && <Link href={`/life?month=${next}`} className={buttonClass} aria-label="Next month">›</Link>}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {tiles.map((t) => (
          <Link
            key={t.slug}
            href={t.slug === 'places' ? '/life/travel' : `/life/area/${t.slug}`}
            className={`block rounded-xl p-3 border ${t.empty ? 'border-dashed border-border' : 'border-border hover:border-navy'}`}
          >
            <p className="text-xs font-semibold text-muted">{t.name}</p>
            {t.empty ? (
              <p className="text-xs text-muted mt-2">{t.empty}</p>
            ) : (
              <>
                <p className="text-lg font-bold text-navy mt-1 leading-tight">{t.main}</p>
                {t.detail && <p className="text-xs text-body-text mt-1">{t.detail}</p>}
              </>
            )}
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card title="Needs attention">
          {!draft && pending === 0 ? (
            <p className="text-sm text-muted">Nothing waiting.</p>
          ) : (
            <ul className="divide-y divide-border">
              {draft && (
                <li className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-body-text">Review for {periodLabel(draft, 'long').split(' ')[0]} is ready</span>
                  <Link href={`/life/review/${draft}`} className="text-xs font-semibold text-blue">Open</Link>
                </li>
              )}
              {pending > 0 && (
                <li className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-body-text">
                    {pending} {pending === 1 ? 'item' : 'items'} waiting in the inbox
                  </span>
                  <Link href="/life/inbox" className="text-xs font-semibold text-blue">Inbox</Link>
                </li>
              )}
            </ul>
          )}
        </Card>

        <Card title="Coming up">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted">No upcoming trips.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Link href={`/life/travel/${t.id}`} className="font-semibold text-navy">{t.title}</Link>
                  <span className="text-xs text-muted whitespace-nowrap">
                    {formatDate(t.start_on, { month: 'short', day: 'numeric' })}
                    {t.end_on && t.end_on !== t.start_on ? ` to ${formatDate(t.end_on, { month: 'short', day: 'numeric' })}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
