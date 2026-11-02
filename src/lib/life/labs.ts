import 'server-only';
import { addDays, type DailyPoint, type Db, type Direction } from './metrics';

// Bloodwork: metrics from the `lab` source, each with a reference range on the
// metric row, read as the latest reading plus the one before it.
export type LabMetric = {
  id: string;
  slug: string;
  name: string;
  unit: string | null;
  direction: Direction;
  ref_low: number | null;
  ref_high: number | null;
  ref_note: string | null;
};

export type Band = 'in' | 'out';

export type LabReading = {
  metric: LabMetric;
  latest: DailyPoint | null;
  previous: DailyPoint | null;
  band: Band | null;
};

export type LabRow = {
  id: string;
  category: string;
  panel: string | null;
  analyte: string;
  value: number | string | null;
  value_text: string | null;
  unit: string | null;
  ref_text: string | null;
  flag: 'normal' | 'low' | 'high' | 'abnormal';
  sort_order: number;
};

export type Labs = {
  readings: LabReading[];
  panelDate: string | null;
  retest: { from: string; to: string } | null; // 30 to 60 days after the panel, to see medicine and diet changes land
  report: { id: string; title: string | null } | null;
  rows: LabRow[]; // every analyte of the latest panel, in report order
  panelDates: string[]; // every panel on file, newest first
};

export function bandOf(m: Pick<LabMetric, 'ref_low' | 'ref_high'>, v: number): Band {
  if (m.ref_low !== null && v < Number(m.ref_low)) return 'out';
  if (m.ref_high !== null && v > Number(m.ref_high)) return 'out';
  return 'in';
}

export function rangeLabel(m: Pick<LabMetric, 'ref_low' | 'ref_high' | 'unit'>): string {
  const lo = m.ref_low === null ? null : Number(m.ref_low);
  const hi = m.ref_high === null ? null : Number(m.ref_high);
  if (lo !== null && hi !== null) return `${lo} to ${hi}`;
  if (hi !== null) return `under ${hi}`;
  if (lo !== null) return `${lo} and up`;
  return '';
}

// Retest window after a panel, in days: long enough for medicine and diet to show.
export const RETEST_DAYS: [number, number] = [30, 60];

const ORDER = ['hba1c', 'glucose_fasting', 'ldl', 'cholesterol_total', 'triglycerides', 'hdl', 'hs_crp', 'egfr', 'vitamin_d'];

export async function getLabs(db: Db): Promise<Labs> {
  const { data: src } = await db.from('sources').select('id').eq('slug', 'lab').maybeSingle();
  const empty: Labs = { readings: [], panelDate: null, retest: null, report: null, rows: [], panelDates: [] };
  if (!src) return empty;

  const { data: mRows, error: mErr } = await db
    .from('metrics')
    .select('id, slug, name, unit, direction, ref_low, ref_high, ref_note')
    .eq('source_id', src.id);
  if (mErr) throw new Error(mErr.message);
  const metrics = ((mRows ?? []) as LabMetric[]).sort((a, b) => {
    const ia = ORDER.indexOf(a.slug);
    const ib = ORDER.indexOf(b.slug);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.name.localeCompare(b.name);
  });
  if (metrics.length === 0) return empty;

  const { data: rows, error } = await db
    .from('measurements')
    .select('metric_id, measured_on, value')
    .in('metric_id', metrics.map((m) => m.id))
    .order('measured_on', { ascending: false });
  if (error) throw new Error(error.message);

  const byMetric = new Map<string, DailyPoint[]>();
  for (const r of (rows ?? []) as { metric_id: string; measured_on: string; value: number | string }[]) {
    const list = byMetric.get(r.metric_id) ?? [];
    list.push({ date: r.measured_on, value: Number(r.value) });
    byMetric.set(r.metric_id, list);
  }

  const readings: LabReading[] = metrics.map((metric) => {
    const [latest = null, previous = null] = byMetric.get(metric.id) ?? [];
    return { metric, latest, previous, band: latest ? bandOf(metric, latest.value) : null };
  });

  const panelDate = readings.reduce<string | null>((d, r) => (r.latest && (!d || r.latest.date > d) ? r.latest.date : d), null);
  const [docRes, rowsRes, datesRes] = await Promise.all([
    panelDate
      ? db.from('documents').select('id, title').eq('doc_date', panelDate).order('created_at', { ascending: false }).limit(1).maybeSingle()
      : Promise.resolve({ data: null }),
    panelDate
      ? db.from('lab_results').select('id, category, panel, analyte, value, value_text, unit, ref_text, flag, sort_order').eq('tested_on', panelDate).order('sort_order')
      : Promise.resolve({ data: [] }),
    db.from('lab_results').select('tested_on').order('tested_on', { ascending: false }),
  ]);

  return {
    readings,
    panelDate,
    retest: panelDate ? { from: addDays(panelDate, RETEST_DAYS[0]), to: addDays(panelDate, RETEST_DAYS[1]) } : null,
    report: (docRes.data as { id: string; title: string | null } | null) ?? null,
    rows: (rowsRes.data ?? []) as LabRow[],
    panelDates: [...new Set(((datesRes.data ?? []) as { tested_on: string }[]).map((r) => r.tested_on))],
  };
}
