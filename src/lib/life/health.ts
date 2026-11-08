import 'server-only';
import { addDays, getDailySeries, getMetrics, type Db, type DailyPoint, type Direction, type MetricDef } from './metrics';

// Health is the foundation. Whoop supplies the daily signals (recovery, sleep,
// strain, HRV, resting HR); weight comes from the journal. Everything here is
// read from `measurements` through the metric slugs below.
export const WHOOP = {
  recovery: 'whoop_recovery',
  sleep: 'whoop_sleep_hours',
  sleepPerf: 'whoop_sleep_performance',
  hrv: 'whoop_hrv_ms',
  rhr: 'whoop_resting_hr',
  strain: 'whoop_strain',
} as const;
export const WEIGHT = 'weight_kg';
export const BLOOD_SUGAR = 'blood_sugar_mgdl';

export type Zone = 'green' | 'yellow' | 'red';
export function zone(recovery: number): Zone {
  return recovery >= 67 ? 'green' : recovery >= 34 ? 'yellow' : 'red';
}
export const ZONE_WORD: Record<Zone, string> = { green: 'Recovered', yellow: 'Adequate', red: 'Run down' };

export type HealthStat = {
  key: keyof typeof WHOOP | 'weight';
  name: string;
  unit: string | null;
  direction: Direction;
  last: DailyPoint | null;
  avg7: number | null;
  avg30: number | null;
  points: DailyPoint[];
};

export type Health = {
  stats: Record<HealthStat['key'], HealthStat>;
  recoveryDays: DailyPoint[]; // every recovery reading in range, date ascending
  from: string;
};

const NAMES: Record<HealthStat['key'], string> = {
  recovery: 'Recovery',
  sleep: 'Sleep',
  sleepPerf: 'Sleep performance',
  hrv: 'HRV',
  rhr: 'Resting heart rate',
  strain: 'Day strain',
  weight: 'Weight',
};

function mean(points: DailyPoint[]): number | null {
  return points.length ? points.reduce((s, p) => s + p.value, 0) / points.length : null;
}

export async function getHealth(db: Db, today: string, days = 90): Promise<Health> {
  const from = addDays(today, -days);
  const metrics = await getMetrics(db);
  const bySlug = new Map(metrics.map((m) => [m.slug, m]));
  const wanted: [HealthStat['key'], string][] = [
    ...(Object.entries(WHOOP) as [keyof typeof WHOOP, string][]),
    ['weight', WEIGHT],
  ];
  const defs = wanted.map(([key, slug]) => [key, bySlug.get(slug)] as [HealthStat['key'], MetricDef | undefined]);
  const ids = defs.map(([, m]) => m?.id).filter((x): x is string => !!x);
  // Weight is sparse, so it gets a longer window than the daily signals.
  const series = await getDailySeries(db, ids, addDays(today, -Math.max(days, 365)), today);

  const stats = {} as Health['stats'];
  for (const [key, m] of defs) {
    const all = m ? (series.get(m.id) ?? []) : [];
    const points = key === 'weight' ? all : all.filter((p) => p.date >= from);
    const last7 = all.filter((p) => p.date > addDays(today, -7));
    const last30 = all.filter((p) => p.date > addDays(today, -30));
    stats[key] = {
      key,
      name: NAMES[key],
      unit: m?.unit ?? null,
      direction: m?.direction ?? 'target',
      last: all[all.length - 1] ?? null,
      avg7: mean(last7),
      avg30: mean(last30),
      points,
    };
  }
  return { stats, recoveryDays: stats.recovery.points, from };
}

// Short human readings for the strip and the hero.
export function fmtHours(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${hh}h ${String(mm).padStart(2, '0')}m`;
}
