// Imports a Whoop data export (the my_whoop_data_YYYY_MM_DD.zip, or its unzipped
// folder) into /life: one measurement per Whoop metric per day from
// physiological_cycles.csv. Each cycle is dated by its wake-up day, so last
// night's sleep and recovery land on the day they describe. Whoop gets its own
// source and metrics so it never overwrites Apple Health. Idempotent: re-running
// a newer export updates the same rows.
//   node --experimental-strip-types scripts/life/import-whoop.ts <export.zip|dir> [--dry-run]
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const { loadEnv, adminFromEnv, ownerIdFrom } = await import('./_shared.ts');

const input = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!input || !existsSync(input)) throw new Error('Usage: import-whoop.ts <export.zip|dir> [--dry-run]');

let dir = input;
if (statSync(input).isFile()) {
  dir = mkdtempSync(join(tmpdir(), 'whoop-'));
  execFileSync('unzip', ['-o', '-q', input, '-d', dir]);
}
const csvPath = join(dir, 'physiological_cycles.csv');
if (!existsSync(csvPath)) throw new Error(`No physiological_cycles.csv in ${input}`);

// The export has no quoted fields in this file, but parse quotes anyway.
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') row.push(cell), (cell = '');
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell), rows.push(row), (row = []), (cell = '');
    } else cell += ch;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  const [head, ...body] = rows.filter((r) => r.some((c) => c !== ''));
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])));
}

// Whoop column → /life metric. `scale` converts the raw value.
const METRICS = [
  { slug: 'whoop_recovery', name: 'Recovery (Whoop)', unit: '%', agg: 'avg', dir: 'higher_better', col: 'Recovery score %' },
  { slug: 'whoop_strain', name: 'Day strain (Whoop)', unit: 'strain', agg: 'avg', dir: 'target', col: 'Day Strain' },
  { slug: 'whoop_hrv_ms', name: 'HRV (Whoop)', unit: 'ms', agg: 'avg', dir: 'higher_better', col: 'Heart rate variability (ms)' },
  { slug: 'whoop_resting_hr', name: 'Resting heart rate (Whoop)', unit: 'bpm', agg: 'avg', dir: 'lower_better', col: 'Resting heart rate (bpm)' },
  { slug: 'whoop_sleep_hours', name: 'Sleep (Whoop)', unit: 'hours', agg: 'avg', dir: 'higher_better', col: 'Asleep duration (min)', scale: 1 / 60 },
  { slug: 'whoop_sleep_performance', name: 'Sleep performance (Whoop)', unit: '%', agg: 'avg', dir: 'higher_better', col: 'Sleep performance %' },
] as const;

const day = (s: string) => s.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;

const daily = new Map<string, { values: Record<string, number>; raw: Record<string, string> }>();
for (const r of parseCsv(readFileSync(csvPath, 'utf8'))) {
  const d = day(r['Wake onset']);
  if (!d) continue; // cycle still in progress or no sleep recorded
  const values: Record<string, number> = {};
  for (const m of METRICS) {
    const v = Number.parseFloat(r[m.col]);
    if (r[m.col] === '' || !Number.isFinite(v)) continue;
    values[m.slug] = Math.round(v * ('scale' in m ? m.scale : 1) * 100) / 100;
  }
  if (Object.keys(values).length) daily.set(d, { values, raw: r });
}
const days = [...daily.keys()].sort();
const measurementCount = days.reduce((n, d) => n + Object.keys(daily.get(d)!.values).length, 0);
console.log(`${days.length} days (${days[0]} to ${days[days.length - 1]}), ${measurementCount} measurements`);
if (dryRun || !days.length) process.exit(0);

loadEnv();
const db = adminFromEnv();
const owner = await ownerIdFrom(db);

const { data: source, error: sErr } = await db
  .from('sources')
  .upsert({ slug: 'whoop', name: 'Whoop', method: 'Whoop data export (CSV)', cadence: 'on demand' }, { onConflict: 'slug' })
  .select('id')
  .single();
if (sErr || !source) throw new Error(`sources: ${sErr?.message}`);
const { data: body, error: aErr } = await db.from('areas').select('id').eq('slug', 'body').single();
if (aErr || !body) throw new Error(`areas: ${aErr?.message}`);
const { data: metricRows, error: mErr } = await db
  .from('metrics')
  .upsert(
    METRICS.map((m) => ({ area_id: body.id, slug: m.slug, name: m.name, unit: m.unit, aggregation: m.agg, direction: m.dir, source_id: source.id })),
    { onConflict: 'slug' }
  )
  .select('id, slug');
if (mErr) throw new Error(`metrics: ${mErr.message}`);
const metricId = new Map((metricRows ?? []).map((m) => [m.slug, m.id]));

const now = new Date().toISOString();
const itemId = new Map<string, string>();
for (let i = 0; i < days.length; i += 500) {
  const rows = days.slice(i, i + 500).map((d) => ({
    owner_id: owner,
    source_id: source.id,
    external_id: `whoop:${d}`,
    received_at: now,
    processed_at: now,
    payload: { day: d, values: daily.get(d)!.values, cycle: daily.get(d)!.raw },
  }));
  const { data, error } = await db.from('source_items').upsert(rows, { onConflict: 'source_id,external_id' }).select('id, external_id');
  if (error) throw new Error(`source_items: ${error.message}`);
  for (const r of data ?? []) itemId.set(r.external_id, r.id);
}

const measurements = days.flatMap((d) =>
  Object.entries(daily.get(d)!.values).map(([slug, value]) => ({
    owner_id: owner,
    metric_id: metricId.get(slug)!,
    measured_on: d,
    value,
    source_item_id: itemId.get(`whoop:${d}`) ?? null,
  }))
);
for (let i = 0; i < measurements.length; i += 500) {
  const { error } = await db.from('measurements').upsert(measurements.slice(i, i + 500), { onConflict: 'owner_id,metric_id,measured_on' });
  if (error) throw new Error(`measurements: ${error.message}`);
}
await db.from('sources').update({ last_run_at: now, last_status: 'ok' }).eq('id', source.id);
console.log(`Imported ${measurements.length} measurements across ${days.length} days`);
