import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader } from '@/components/life/ui';
import {
  AREA_PHASE,
  METRIC_COLUMNS,
  addDays,
  formatDate,
  formatValue,
  getDailySeries,
  ictToday,
  toMonthly,
  type MetricDef,
} from '@/lib/life/metrics';
import { BarChart, LineChart } from './charts';

const RANGES = { '1y': '1Y', '5y': '5Y', all: 'All' } as const;
type Range = keyof typeof RANGES;

type RecordRow = {
  id: string;
  kind: string;
  title: string;
  started_on: string | null;
  ended_on: string | null;
  date_precision: 'day' | 'month' | 'year' | 'approx';
  notes: string | null;
};

function recordDate(r: RecordRow): string {
  if (!r.started_on) return 'Date unknown';
  const d = r.started_on;
  if (r.date_precision === 'year') return d.slice(0, 4);
  if (r.date_precision === 'approx') return `About ${d.slice(0, 4)}`;
  if (r.date_precision === 'month') return formatDate(d, { month: 'short', year: 'numeric' });
  return formatDate(d);
}

function relative(ts: string | null): string {
  if (!ts) return 'never run';
  return new Date(ts).toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AreaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const { slug } = await params;
  if (slug === 'places') redirect('/life/travel');
  const { supabase } = await requireOwner();
  const sp = await searchParams;
  const range: Range = typeof sp.range === 'string' && sp.range in RANGES ? (sp.range as Range) : '1y';

  const { data: area } = await supabase.from('areas').select('id, slug, name, description').eq('slug', slug).maybeSingle();
  if (!area) notFound();

  const today = ictToday();
  const from = range === '1y' ? addDays(today, -365) : range === '5y' ? addDays(today, -365 * 5) : null;

  const [metricsRes, recordsRes, goalsRes] = await Promise.all([
    supabase.from('metrics').select(METRIC_COLUMNS).eq('area_id', area.id).order('slug'),
    supabase
      .from('records')
      .select('id, kind, title, started_on, ended_on, date_precision, notes')
      .eq('area_id', area.id)
      .order('started_on', { ascending: false, nullsFirst: false })
      .limit(100),
    supabase
      .from('goals')
      .select('id, title, horizon, due_on, target_value, metric_id')
      .eq('area_id', area.id)
      .eq('status', 'open')
      .order('due_on', { ascending: true, nullsFirst: false }),
  ]);

  const metrics = (metricsRes.data ?? []) as MetricDef[];
  const records = (recordsRes.data ?? []) as RecordRow[];
  const goals = (goalsRes.data ?? []) as { id: string; title: string; horizon: string; due_on: string | null; target_value: number | null; metric_id: string | null }[];

  const sourceIds = [...new Set(metrics.map((m) => m.source_id).filter((x): x is string => !!x))];
  const [daily, sourcesRes] = await Promise.all([
    getDailySeries(supabase, metrics.map((m) => m.id), from, today),
    sourceIds.length
      ? supabase.from('sources').select('id, name, cadence, last_run_at, last_status').in('id', sourceIds)
      : Promise.resolve({ data: [] }),
  ]);
  const sources = (sourcesRes.data ?? []) as { id: string; name: string; cadence: string; last_run_at: string | null; last_status: string | null }[];
  const metricName = new Map(metrics.map((m) => [m.id, m]));

  const phase = AREA_PHASE[area.slug] ?? 2;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title={area.name}
        subtitle={area.description ?? undefined}
        actions={
          <div className="flex gap-1">
            {(Object.keys(RANGES) as Range[]).map((r) => (
              <Link
                key={r}
                href={`/life/area/${area.slug}?range=${r}`}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border-[1.5px] ${
                  r === range ? 'bg-navy border-navy text-white' : 'bg-white border-navy text-navy'
                }`}
              >
                {RANGES[r]}
              </Link>
            ))}
          </div>
        }
      />

      {metrics.length === 0 ? (
        <div className="mb-6">
          <EmptyState>No metrics for this area yet. Sources arrive in Phase {phase}.</EmptyState>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {metrics.map((m) => {
            const pts = daily.get(m.id) ?? [];
            const bars = m.aggregation === 'sum';
            const useDaily = !bars && range === '1y';
            const series = useDaily
              ? pts.map((p) => ({ x: formatDate(p.date, { month: 'short', year: '2-digit' }), value: p.value }))
              : toMonthly(pts, m.aggregation).map((p) => ({ x: formatDate(`${p.period}-01`, { month: 'short', year: '2-digit' }), value: p.value }));
            const goal = goals.find((g) => g.metric_id === m.id && g.target_value !== null);
            const latest = pts[pts.length - 1];
            return (
              <Card key={m.id}>
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h2 className="text-sm font-semibold text-navy">
                    {m.name}
                    {m.unit && m.unit !== 'count' ? ` (${m.unit})` : ''}
                    {bars ? <span className="text-muted font-normal"> · per month</span> : null}
                  </h2>
                  {goal && <span className="text-xs text-muted">goal {formatValue(Number(goal.target_value), m.unit)}</span>}
                </div>
                {series.length === 0 ? (
                  <p className="text-sm text-muted py-8 text-center">No data in this range</p>
                ) : bars ? (
                  <BarChart points={series} label={`${m.name} per month`} />
                ) : (
                  <LineChart points={series} label={m.name} />
                )}
                {latest && (
                  <p className="text-xs text-muted mt-1">
                    Latest {formatValue(latest.value, m.unit)} on {formatDate(latest.date)}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Records" className="md:col-span-2">
          {records.length === 0 ? (
            <p className="text-sm text-muted">No records yet.</p>
          ) : (
            <ol className="border-l-2 border-border ml-1">
              {records.map((r) => (
                <li key={r.id} className="relative pl-4 pb-4 last:pb-0">
                  <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-navy" />
                  <p className="text-xs text-muted">{recordDate(r)}</p>
                  <p className="text-sm font-semibold text-navy">
                    {r.title} <Chip>{r.kind}</Chip>
                  </p>
                  {r.notes && <p className="text-xs text-body-text mt-0.5 line-clamp-2">{r.notes}</p>}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-4">
          <Card title="Open goals">
            {goals.length === 0 ? (
              <p className="text-sm text-muted">No open goals.</p>
            ) : (
              <ul className="space-y-2">
                {goals.map((g) => {
                  const m = g.metric_id ? metricName.get(g.metric_id) : undefined;
                  return (
                    <li key={g.id} className="text-sm">
                      <p className="font-semibold text-navy">{g.title}</p>
                      <p className="text-xs text-muted">
                        {g.horizon}
                        {g.due_on ? ` · due ${formatDate(g.due_on)}` : ''}
                        {m && g.target_value !== null ? ` · ${m.name} ${formatValue(Number(g.target_value), m.unit)}` : ''}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Sources">
            {sources.length === 0 ? (
              <p className="text-sm text-muted">No source yet · Phase {phase}</p>
            ) : (
              <ul className="space-y-2">
                {sources.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-navy">{s.name}</span>
                    <span className={`text-xs ${s.last_status?.startsWith('error') ? 'text-magenta' : 'text-muted'}`}>
                      {s.last_status?.startsWith('error') ? 'error · ' : ''}
                      {relative(s.last_run_at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/life/sources" className="block text-xs font-semibold text-blue mt-3">All sources</Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
