import { hasSecret } from '@/lib/life/auth';
import { getOwnerId, lifeAdmin, startRun } from '@/lib/life/supabase-admin';

// W4: Health Auto Export REST automation (JSON, aggregated by day). Each metric
// becomes one measurement per day; re-sends overwrite the same rows.
export const maxDuration = 60;

interface HaePoint {
  date?: string;
  qty?: number;
  Avg?: number;
  avg?: number;
  totalSleep?: number;
  asleep?: number;
  core?: number;
  deep?: number;
  rem?: number;
}
interface HaeMetric {
  name?: string;
  units?: string;
  data?: HaePoint[];
}
interface HaeWorkout {
  start?: string;
  startDate?: string;
}
interface HaePayload {
  data?: { metrics?: HaeMetric[]; workouts?: HaeWorkout[] };
}

type Agg = 'sum' | 'avg' | 'last';
const MAP: Record<string, { slug: string; agg: Agg }> = {
  step_count: { slug: 'steps', agg: 'sum' },
  active_energy: { slug: 'active_kcal', agg: 'sum' },
  sleep_analysis: { slug: 'sleep_hours', agg: 'sum' },
  resting_heart_rate: { slug: 'resting_hr', agg: 'avg' },
  heart_rate_variability: { slug: 'hrv_ms', agg: 'avg' },
  weight_body_mass: { slug: 'weight_kg', agg: 'last' },
  body_fat_percentage: { slug: 'body_fat_pct', agg: 'last' },
};

// "2026-10-31 00:00:00 +0700" → "2026-10-31": the export's local day.
function day(s: string | undefined): string | null {
  const m = s?.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function pointValue(metric: string, units: string, p: HaePoint): number | null {
  let v: number | undefined;
  if (metric === 'sleep_analysis') {
    v = p.totalSleep ?? p.asleep ?? (p.core !== undefined || p.deep !== undefined || p.rem !== undefined ? (p.core ?? 0) + (p.deep ?? 0) + (p.rem ?? 0) : undefined);
    if (v !== undefined && /^min/.test(units)) v = v / 60;
  } else {
    v = p.qty ?? p.Avg ?? p.avg;
  }
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (metric === 'active_energy' && units.toLowerCase() === 'kj') v = v / 4.184;
  if (metric === 'weight_body_mass' && /^(lb|lbs)$/.test(units.toLowerCase())) v = v * 0.45359237;
  if (metric === 'body_fat_percentage' && v > 0 && v <= 1) v = v * 100; // some exports send a fraction
  return v;
}

export async function POST(request: Request) {
  if (!hasSecret(request, 'LIFE_INGEST_SECRET')) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: HaePayload;
  try {
    body = (await request.json()) as HaePayload;
  } catch {
    return Response.json({ error: 'Body must be JSON' }, { status: 400 });
  }
  const metrics = body.data?.metrics ?? [];
  const workouts = body.data?.workouts ?? [];
  if (!Array.isArray(metrics) || !Array.isArray(workouts)) return Response.json({ error: 'Unexpected payload shape' }, { status: 400 });

  // day → slug → values
  const byDay = new Map<string, Map<string, { agg: Agg; values: number[] }>>();
  const add = (d: string, slug: string, agg: Agg, v: number) => {
    const slugs = byDay.get(d) ?? new Map();
    const cell = slugs.get(slug) ?? { agg, values: [] };
    cell.values.push(v);
    slugs.set(slug, cell);
    byDay.set(d, slugs);
  };
  let pointsIn = 0;
  for (const m of metrics) {
    const map = m.name ? MAP[m.name] : undefined;
    if (!map) continue;
    for (const p of m.data ?? []) {
      const d = day(p.date);
      const v = pointValue(m.name!, m.units ?? '', p);
      if (!d || v === null) continue;
      pointsIn++;
      add(d, map.slug, map.agg, v);
    }
  }
  const workoutDays = new Map<string, number>();
  for (const w of workouts) {
    const d = day(w.start ?? w.startDate);
    if (d) workoutDays.set(d, (workoutDays.get(d) ?? 0) + 1);
  }
  for (const [d, count] of workoutDays) add(d, 'workouts', 'last', count);
  pointsIn += workouts.length;

  if (!byDay.size) return Response.json({ ok: true, days: 0, measurements: 0 });

  const finish = await startRun('health', 'apple_health');
  try {
    const owner = await getOwnerId();
    const [{ data: source, error: sErr }, { data: metricRows, error: mErr }] = await Promise.all([
      lifeAdmin.from('sources').select('id').eq('slug', 'apple_health').single(),
      lifeAdmin.from('metrics').select('id, slug'),
    ]);
    if (sErr || !source) throw new Error(`sources: ${sErr?.message ?? 'apple_health missing'}`);
    if (mErr) throw new Error(`metrics: ${mErr.message}`);
    const metricId = new Map((metricRows ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id]));

    const days = [...byDay.keys()].sort();
    const daily = days.map((d) => {
      const values: Record<string, number> = {};
      for (const [slug, { agg, values: vs }] of byDay.get(d)!) {
        const v = agg === 'sum' ? vs.reduce((a, b) => a + b, 0) : agg === 'avg' ? vs.reduce((a, b) => a + b, 0) / vs.length : vs[vs.length - 1];
        values[slug] = Math.round(v * 100) / 100;
      }
      return { day: d, values };
    });

    // One source_item per day in the batch, so a re-send updates it in place.
    const now = new Date().toISOString();
    const itemId = new Map<string, string>();
    for (let i = 0; i < daily.length; i += 500) {
      const rows = daily.slice(i, i + 500).map((x) => ({
        owner_id: owner,
        source_id: source.id,
        external_id: `health:${x.day}`,
        received_at: now,
        processed_at: now,
        payload: { day: x.day, values: x.values },
      }));
      const { data, error } = await lifeAdmin.from('source_items').upsert(rows, { onConflict: 'source_id,external_id' }).select('id, external_id');
      if (error) throw new Error(`source_items: ${error.message}`);
      for (const r of data ?? []) itemId.set(r.external_id, r.id);
    }

    const measurements = daily.flatMap((x) =>
      Object.entries(x.values)
        .filter(([slug]) => metricId.has(slug))
        .map(([slug, value]) => ({
          owner_id: owner,
          metric_id: metricId.get(slug)!,
          measured_on: x.day,
          value,
          source_item_id: itemId.get(`health:${x.day}`) ?? null,
        }))
    );
    for (let i = 0; i < measurements.length; i += 500) {
      const { error } = await lifeAdmin
        .from('measurements')
        .upsert(measurements.slice(i, i + 500), { onConflict: 'owner_id,metric_id,measured_on' });
      if (error) throw new Error(`measurements: ${error.message}`);
    }

    await finish({ itemsIn: pointsIn, itemsOut: measurements.length });
    return Response.json({ ok: true, days: days.length, from: days[0], to: days[days.length - 1], measurements: measurements.length });
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    await finish({ error });
    return Response.json({ ok: false, error }, { status: 500 });
  }
}
