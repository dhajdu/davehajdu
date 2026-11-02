import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

// Metric helpers shared by the /life pages (session client, RLS) and the
// review cron (lifeAdmin). Periods are 'YYYY-MM'; dates are 'YYYY-MM-DD'.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Db = SupabaseClient<any, any, any>;

import { formatNumber, formatValue, trendTone, type Direction } from './format';
export { formatNumber, formatValue, trendTone, type Direction };

export type Aggregation = 'avg' | 'sum' | 'last';

export type MetricDef = {
  id: string;
  slug: string;
  name: string;
  unit: string | null;
  aggregation: Aggregation;
  direction: Direction;
  area_id: string;
  source_id: string | null;
};

export type DailyPoint = { date: string; value: number };
export type MonthPoint = { period: string; value: number; days: number };

export type MetricSummary = {
  metric: MetricDef;
  value: number | null;
  prev: number | null;
  avg12: number | null;
};

export const TZ = 'Asia/Ho_Chi_Minh';
export const METRIC_COLUMNS = 'id, slug, name, unit, aggregation, direction, area_id, source_id';

// ===== Dates and periods =====

export function ictToday(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function currentPeriod(now = new Date()): string {
  return ictToday(now).slice(0, 7);
}

export function isPeriod(s: unknown): s is string {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}$/.test(s)) return false;
  const m = Number(s.slice(5));
  return m >= 1 && m <= 12;
}

export function shiftPeriod(period: string, months: number): string {
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(5, 7)) - 1 + months;
  const d = new Date(Date.UTC(y, m, 1));
  return d.toISOString().slice(0, 7);
}

export function periodStart(period: string): string {
  return `${period}-01`;
}

export function periodEnd(period: string): string {
  const y = Number(period.slice(0, 4));
  const m = Number(period.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function periodLabel(period: string, style: 'long' | 'short' = 'long'): string {
  const d = new Date(`${period}-01T00:00:00Z`);
  return d.toLocaleDateString('en-US', { month: style, year: 'numeric', timeZone: 'UTC' });
}

export function formatDate(date: string, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
}

// ===== Fetching =====

// PostgREST caps responses (1000 rows by default), so page through with range().
export async function fetchAll<T>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await page(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    rows.push(...(data ?? []));
    if (!data || data.length < pageSize) break;
  }
  return rows;
}

export async function getMetrics(db: Db): Promise<MetricDef[]> {
  const { data, error } = await db.from('metrics').select(METRIC_COLUMNS).order('slug');
  if (error) throw new Error(error.message);
  return (data ?? []) as MetricDef[];
}

// Daily values per metric id, ordered by date. `from`/`to` inclusive, either may be null.
export async function getDailySeries(
  db: Db,
  metricIds: string[],
  from: string | null,
  to: string | null
): Promise<Map<string, DailyPoint[]>> {
  const out = new Map<string, DailyPoint[]>(metricIds.map((id) => [id, []]));
  if (metricIds.length === 0) return out;
  const rows = await fetchAll<{ metric_id: string; measured_on: string; value: number | string }>((a, b) => {
    let q = db.from('measurements').select('metric_id, measured_on, value').in('metric_id', metricIds);
    if (from) q = q.gte('measured_on', from);
    if (to) q = q.lte('measured_on', to);
    return q.order('measured_on').order('metric_id').range(a, b);
  });
  for (const r of rows) out.get(r.metric_id)?.push({ date: r.measured_on, value: Number(r.value) });
  return out;
}

// ===== Aggregation =====

export function aggregate(values: number[], agg: Aggregation): number | null {
  if (values.length === 0) return null;
  if (agg === 'last') return values[values.length - 1];
  const sum = values.reduce((s, v) => s + v, 0);
  return agg === 'sum' ? sum : sum / values.length;
}

// Groups date-ordered daily points into months using the metric's aggregation.
export function toMonthly(points: DailyPoint[], agg: Aggregation): MonthPoint[] {
  const byMonth = new Map<string, number[]>();
  for (const p of points) {
    const k = p.date.slice(0, 7);
    if (!byMonth.has(k)) byMonth.set(k, []);
    byMonth.get(k)!.push(p.value);
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, vals]) => ({ period, value: aggregate(vals, agg)!, days: vals.length }));
}

export async function getMonthlySeries(db: Db, metric: MetricDef, from: string | null, to: string | null) {
  const daily = await getDailySeries(db, [metric.id], from, to);
  return toMonthly(daily.get(metric.id) ?? [], metric.aggregation);
}

function mean(vals: number[]): number | null {
  return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : null;
}

// Month value vs previous month and vs the average of the 12 months before it
// (months without data are left out of the average, not counted as zero).
export function summarize(metric: MetricDef, monthly: MonthPoint[], period: string): MetricSummary {
  const map = new Map(monthly.map((m) => [m.period, m.value]));
  const prior: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const v = map.get(shiftPeriod(period, -i));
    if (v !== undefined) prior.push(v);
  }
  return {
    metric,
    value: map.get(period) ?? null,
    prev: map.get(shiftPeriod(period, -1)) ?? null,
    avg12: mean(prior),
  };
}

// One query for every metric: the period plus the 12 months before it.
export async function getMetricSummaries(db: Db, metrics: MetricDef[], period: string): Promise<MetricSummary[]> {
  const daily = await getDailySeries(db, metrics.map((m) => m.id), periodStart(shiftPeriod(period, -12)), periodEnd(period));
  return metrics.map((m) => summarize(m, toMonthly(daily.get(m.id) ?? [], m.aggregation), period));
}

// Value of one metric for one month.
export async function metricValueForMonth(db: Db, metric: MetricDef, period: string): Promise<number | null> {
  const monthly = await getMonthlySeries(db, metric, periodStart(period), periodEnd(period));
  return monthly[0]?.value ?? null;
}

// Did a metric goal hit? 'target' direction counts as hit within 2% of target.
export function goalHit(direction: Direction, value: number, target: number): boolean {
  if (direction === 'higher_better') return value >= target;
  if (direction === 'lower_better') return value <= target;
  return Math.abs(value - target) <= Math.abs(target) * 0.02;
}

// ===== Table-derived counts (truth even when no measurement rows exist) =====

export async function countEntriesByMonth(db: Db, kind: string, fromPeriod: string, toPeriod: string): Promise<Map<string, number>> {
  const rows = await fetchAll<{ entry_date: string }>((a, b) =>
    db
      .from('entries')
      .select('entry_date')
      .eq('kind', kind)
      .gte('entry_date', periodStart(fromPeriod))
      .lte('entry_date', periodEnd(toPeriod))
      .order('entry_date')
      .range(a, b)
  );
  const out = new Map<string, number>();
  for (const r of rows) {
    const k = r.entry_date.slice(0, 7);
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return out;
}

export type CountSummary = { value: number; prev: number; avg12: number | null };

// Month count vs previous month and 12-month average (only months since the first one with data).
export function summarizeCounts(counts: Map<string, number>, period: string): CountSummary {
  const months = [...counts.keys()].sort();
  const first = months[0];
  const prior: number[] = [];
  for (let i = 1; i <= 12; i++) {
    const p = shiftPeriod(period, -i);
    if (first && p >= first) prior.push(counts.get(p) ?? 0);
  }
  return { value: counts.get(period) ?? 0, prev: counts.get(shiftPeriod(period, -1)) ?? 0, avg12: mean(prior) };
}

export type TripRow = { id: string; title: string; start_on: string; end_on: string | null; purpose: string };

// Trips that overlap [from, to] (inclusive dates).
export async function tripsOverlapping(db: Db, from: string, to: string): Promise<TripRow[]> {
  const { data, error } = await db
    .from('trips')
    .select('id, title, start_on, end_on, purpose')
    .lte('start_on', to)
    .or(`end_on.gte.${from},and(end_on.is.null,start_on.gte.${from})`)
    .order('start_on');
  if (error) throw new Error(error.message);
  return (data ?? []) as TripRow[];
}

// Nights of a trip that fall inside [from, to]. A night belongs to the date it starts.
export function nightsInRange(trip: { start_on: string; end_on: string | null }, from: string, to: string): number {
  if (!trip.end_on) return 0;
  const start = trip.start_on > from ? trip.start_on : from;
  const endExclusive = trip.end_on < addDays(to, 1) ? trip.end_on : addDays(to, 1);
  return Math.max(0, daysBetween(start, endExclusive));
}

// ===== Formatting: see format.ts (client-safe), re-exported above =====

// Which phase brings each area its first source (docs/architecture/life.md).
export const AREA_PHASE: Record<string, number> = {
  body: 1, mind: 1, places: 1, direction: 1,
  people: 2, money: 2, work: 2, admin: 2,
  time: 3, legacy: 3,
};

export type AreaRow = { id: string; slug: string; name: string; sort_order: number; description: string | null };

export async function getAreas(db: Db): Promise<AreaRow[]> {
  const { data, error } = await db.from('areas').select('id, slug, name, sort_order, description').order('sort_order');
  if (error) throw new Error(error.message);
  return (data ?? []) as AreaRow[];
}
