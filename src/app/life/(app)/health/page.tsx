import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { LineChart, BarChart } from '@/components/life/charts';
import { Ring } from '@/components/life/health/Ring';
import { Stat } from '@/components/life/health/Stat';
import { RecoveryHeat } from '@/components/life/health/RecoveryHeat';
import { StrainHeat } from '@/components/life/health/StrainHeat';
import { getLongGoals } from '@/lib/life/focus';
import { ZONE_WORD, getHealth, WEIGHT, zone } from '@/lib/life/health';
import { addDays, aggregate, formatDate, ictToday, toMonthly, type Aggregation, type DailyPoint } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Fitness', robots: { index: false, follow: false } };

const RANGES = { '90d': ['90 days', 90], '1y': ['1 year', 365], all: ['All', 3650] } as const;
type Range = keyof typeof RANGES;

// Daily readings are noisy, so the 90-day view rolls them up by week
// (Monday start) and the longer views by month.
function toWeekly(points: DailyPoint[], agg: Aggregation) {
  const byWeek = new Map<string, number[]>();
  for (const p of points) {
    const dow = (new Date(`${p.date}T00:00:00Z`).getUTCDay() + 6) % 7;
    const k = addDays(p.date, -dow);
    if (!byWeek.has(k)) byWeek.set(k, []);
    byWeek.get(k)!.push(p.value);
  }
  return [...byWeek.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([week, vals]) => ({ week, value: aggregate(vals, agg)! }));
}

function series(points: DailyPoint[], by: 'week' | 'month', agg: Aggregation = 'avg') {
  if (by === 'week') return toWeekly(points, agg).map((p) => ({ x: formatDate(p.week, { month: 'short', day: 'numeric' }), value: Math.round(p.value * 10) / 10 }));
  return toMonthly(points, agg).map((p) => ({ x: formatDate(`${p.period}-01`, { month: 'short', year: '2-digit' }), value: Math.round(p.value * 10) / 10 }));
}

export default async function HealthPage({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const range: Range = typeof sp.range === 'string' && sp.range in RANGES ? (sp.range as Range) : '90d';
  const today = ictToday();
  const days = RANGES[range][1];

  const [health, goals, sourceRes] = await Promise.all([
    getHealth(supabase, today, days),
    getLongGoals(supabase),
    supabase.from('sources').select('name, last_run_at, last_status').eq('slug', 'whoop').maybeSingle(),
  ]);
  const weightTarget = goals.find((g) => g.metric?.slug === WEIGHT && g.target_value !== null && g.status === 'open')?.target_value;
  const target = weightTarget === undefined || weightTarget === null ? null : Number(weightTarget);
  const s = health.stats;
  const rec = s.recovery.last;
  const z = rec ? zone(rec.value) : null;
  const daily = range === '90d';
  const source = sourceRes.data as { name: string; last_run_at: string | null; last_status: string | null } | null;

  const by = daily ? 'week' : 'month';
  const charts: { title: string; stat: typeof s.sleep; bars?: boolean; target?: number | null; agg?: Aggregation; domain?: [number | null, number | null] }[] = [
    { title: 'Sleep, hours a night', stat: s.sleep, domain: [0, null] },
    { title: 'Recovery', stat: s.recovery, domain: [0, 100] },
    { title: 'HRV', stat: s.hrv, domain: [0, null] },
    { title: 'Resting heart rate', stat: s.rhr, domain: [0, null] },
    { title: 'Day strain', stat: s.strain, bars: true, domain: [0, 21] },
    { title: 'Weight', stat: s.weight, target, agg: 'last' },
  ];

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Fitness"
        subtitle="The foundation. Whoop supplies the signals, the journal supplies the weight."
        actions={
          <nav className="life-seg" aria-label="Range">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <Link key={r} href={`/life/health?range=${r}`} aria-current={r === range ? 'page' : undefined}>
                {RANGES[r][0]}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="space-y-5">
        <section className="life-hero" aria-label="Latest readings">
          <div className="life-hero-ring">
            <Ring value={rec?.value ?? null} zone={z} />
            <span className={`life-zone${z ? ` is-${z}` : ''}`}>{z ? ZONE_WORD[z] : 'No recovery yet'}</span>
            {rec && <span className="life-hero-when">{rec.date === today ? 'Today' : formatDate(rec.date, { weekday: 'short', month: 'short', day: 'numeric' })}</span>}
          </div>
          <div className="life-hero-stats">
            <Stat stat={s.sleep} vs="avg7" label="Sleep" />
            <Stat stat={s.sleepPerf} vs="avg7" label="Sleep performance" />
            <Stat stat={s.strain} vs="avg7" label="Day strain" />
            <Stat stat={s.hrv} label="HRV" />
            <Stat stat={s.rhr} label="Resting HR" />
            <Stat stat={s.weight} target={target} label="Weight" />
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-4">
          <Card title="Recovery by day">
            <RecoveryHeat days={health.recoveryDays} today={today} weeks={20} />
          </Card>
          <Card title="Strain by day">
            <StrainHeat days={s.strain.points} today={today} weeks={20} />
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {charts.map((c) => {
            const pts = series(c.stat.points, by, c.agg);
            const latest = c.stat.last;
            return (
              <Card key={c.title}>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h2 className="text-sm font-semibold text-navy">
                    {c.title}
                    <span className="text-muted font-normal"> · by {by}</span>
                  </h2>
                  {c.target != null && <span className="text-xs text-muted">goal {c.target} {c.stat.unit}</span>}
                </div>
                {pts.length === 0 ? (
                  <p className="text-sm text-muted py-8 text-center">No data in this range</p>
                ) : c.bars ? (
                  <BarChart points={pts} label={c.title} />
                ) : (
                  <LineChart points={pts} label={c.title} target={c.target} domain={c.domain} />
                )}
                {latest && (
                  <p className="text-xs text-muted mt-1">
                    Latest {Math.round(latest.value * 10) / 10}{c.stat.unit && c.stat.unit !== 'count' ? ` ${c.stat.unit}` : ''} on {formatDate(latest.date)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        <p className="text-xs text-muted">
          {source
            ? `${source.name}: last sync ${source.last_run_at ? formatDate(source.last_run_at.slice(0, 10)) : 'never'}${source.last_status?.startsWith('error') ? ` · ${source.last_status}` : ''}.`
            : 'No Whoop source registered.'}{' '}
          <Link href="/life/sources" className="font-semibold text-blue">Sources</Link>
        </p>
      </div>
    </div>
  );
}
