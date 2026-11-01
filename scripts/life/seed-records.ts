// Hand-seeded life records (PR slice 12). Idempotent by title.
//   node --experimental-strip-types scripts/life/seed-records.ts
import * as nodeModule from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Lets Node resolve the extensionless imports the Next.js code uses (Node 23.5+).
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\.[cm]?[jt]s$/.test(spec) && ctx.parentURL) {
      for (const ext of ['.ts', '/index.ts']) {
        const u = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(u))) return next(u.href, ctx);
      }
    }
    return next(spec, ctx);
  },
});
const { loadEnv, adminFromEnv, ownerIdFrom } = await import('./_shared');

interface Seed {
  area: string;
  kind: string;
  title: string;
  started_on: string | null;
  date_precision: 'day' | 'month' | 'year' | 'approx';
  notes: string | null;
}

const RECORDS: Seed[] = [
  { area: 'body', kind: 'injury', title: 'ACL tear', started_on: null, date_precision: 'approx', notes: 'Age 19' },
  { area: 'body', kind: 'surgery', title: 'Back surgery', started_on: null, date_precision: 'approx', notes: 'Between ages 28 and 33' },
  { area: 'body', kind: 'surgery', title: 'Spinal fusion', started_on: '2022-01-01', date_precision: 'year', notes: null },
  { area: 'places', kind: 'move', title: 'Moved to Vietnam', started_on: '2006-01-01', date_precision: 'year', notes: null },
  { area: 'work', kind: 'company', title: 'Started TINYpulse', started_on: '2012-01-01', date_precision: 'year', notes: null },
  { area: 'work', kind: 'milestone', title: 'TINYpulse exit', started_on: '2021-01-01', date_precision: 'year', notes: null },
  { area: 'work', kind: 'company', title: 'Started Edge8', started_on: '2022-01-01', date_precision: 'approx', notes: 'Between 2022 and 2023' },
];

loadEnv();
const db = adminFromEnv();
const owner = await ownerIdFrom(db);

const { data: areas, error: areaErr } = await db.from('areas').select('id, slug');
if (areaErr) throw new Error(areaErr.message);
const areaId = new Map((areas ?? []).map((a: { id: string; slug: string }) => [a.slug, a.id]));

const { data: existing, error: exErr } = await db.from('records').select('title').eq('owner_id', owner).in('title', RECORDS.map((r) => r.title));
if (exErr) throw new Error(exErr.message);
const have = new Set((existing ?? []).map((r: { title: string }) => r.title));

const rows = RECORDS.filter((r) => !have.has(r.title)).map(({ area, ...r }) => {
  const id = areaId.get(area);
  if (!id) throw new Error(`Unknown area ${area}`);
  return { ...r, area_id: id, owner_id: owner };
});
if (rows.length) {
  const { error } = await db.from('records').insert(rows);
  if (error) throw new Error(error.message);
}
console.log(`Inserted ${rows.length} records, ${have.size} already present.`);
