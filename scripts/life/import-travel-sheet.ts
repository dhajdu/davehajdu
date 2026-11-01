// Imports a travel-history export (JSON array of rows with the spreadsheet's
// headers: Type, Date, Airline / Hotel, From, To, Class, Price paid, Currency,
// Booked via, Confirmation/booking ref, Booking email date, Notes) through the
// same apply path as Gmail, then rebuilds trips. Idempotent by leg_key.
//   node --experimental-strip-types scripts/life/import-travel-sheet.ts rows.json [--dry-run]
import * as nodeModule from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Resolve extensionless imports and stub `server-only` for scripts.
type Next = (spec: string, ctx: { parentURL?: string }) => unknown;
(nodeModule as unknown as { registerHooks(h: { resolve: (s: string, c: { parentURL?: string }, n: Next) => unknown }): void }).registerHooks({
  resolve(spec, ctx, next) {
    if (spec === 'server-only') return { url: 'data:text/javascript,', shortCircuit: true };
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
const { AIRPORTS } = await import('../../src/lib/life/extract/airports');
const { applyTravel } = await import('../../src/lib/life/extract/apply-travel');
const { rebuildTrips } = await import('../../src/lib/life/trips');

type Row = Record<string, string | number | null>;
const file = process.argv[2];
const dryRun = process.argv.includes('--dry-run');
if (!file) throw new Error('Usage: import-travel-sheet.ts rows.json [--dry-run]');
const rows: Row[] = JSON.parse(readFileSync(file, 'utf8'));

const iata = (s: unknown) => String(s ?? '').match(/\(([A-Z]{3})(?:\/[A-Z]{3})?\)/)?.[1] ?? null;
const str = (v: unknown) => (v === null || v === undefined || v === '' ? null : String(v));

// Hotel cities without an airport of their own.
const CITY_TZ: Record<string, string> = {
  manila: 'Asia/Manila', makati: 'Asia/Manila', taguig: 'Asia/Manila', 'angeles city': 'Asia/Manila',
  'vung tau': 'Asia/Ho_Chi_Minh', bloomington: 'America/Indiana/Indianapolis', seatac: 'America/Los_Angeles',
};
const airportCities = Object.values(AIRPORTS).map((a) => ({ city: a.city.toLowerCase(), tz: a.tz, country: a.country }));
function cityTz(city: string | null): { tz: string; country: string | null } | null {
  if (!city) return null;
  const c = city.toLowerCase();
  const hit = airportCities.find((a) => c.includes(a.city));
  if (hit) return { tz: hit.tz, country: hit.country };
  const key = Object.keys(CITY_TZ).find((k) => c.includes(k));
  return key ? { tz: CITY_TZ[key], country: null } : null;
}

const live = rows.filter((r) => r.Type && r.Date && !/^CANCELLED/i.test(String(r.Notes ?? '')));
live.sort((a, b) => String(a.Date).localeCompare(String(b.Date)));
const skipped = rows.filter((r) => r.Type && r.Date).length - live.length;

loadEnv();
const db = dryRun ? null : adminFromEnv();
const owner = db ? await ownerIdFrom(db) : '';
const counts = { flights: 0, hotels: 0, written: 0, queued: 0, cancelled_skipped: skipped, notes: [] as string[] };
let lastArrivalTz = 'Asia/Ho_Chi_Minh';

for (const r of live) {
  const date = String(r.Date).slice(0, 10);
  const notes = String(r.Notes ?? '');
  const confidence = /UNCERTAIN/i.test(notes) ? 0.6 : 0.95;
  const code = str(r['Confirmation/booking ref'])?.replace(/^(Itin|Booking|Ref)\s*/i, '') ?? null;
  let leg;
  if (r.Type === 'Flight') {
    const origin = iata(r.From), dest = iata(r.To);
    const name = String(r['Airline / Hotel'] ?? '');
    const number = name.match(/\b([A-Z0-9]{2}\s?\d{1,4})\b/)?.[1] ?? null;
    if (dest && AIRPORTS[dest]) lastArrivalTz = AIRPORTS[dest].tz;
    counts.flights++;
    leg = {
      kind: 'flight' as const, status: 'confirmed' as const, confirmation_code: code, provider: name.replace(number ?? '', '').trim() || null,
      number, origin_iata: origin, destination_iata: dest, origin_city: null, destination_city: null,
      starts_at_local: `${date}T12:00:00`, start_tz: null, ends_at_local: null, end_tz: null,
      hotel_name: null, address: null, city: null, country: null, confidence,
    };
  } else {
    const city = str(r.To);
    const where = cityTz(city);
    const out = notes.match(/[Cc]heck-out (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
    counts.hotels++;
    leg = {
      kind: 'hotel' as const, status: 'confirmed' as const, confirmation_code: code, provider: str(r['Booked via']),
      number: null, origin_iata: null, destination_iata: null, origin_city: null, destination_city: null,
      starts_at_local: `${date}T15:00:00`, start_tz: where?.tz ?? lastArrivalTz,
      ends_at_local: out ? `${out}T11:00:00` : null, end_tz: where?.tz ?? lastArrivalTz,
      hotel_name: str(r['Airline / Hotel']), address: null, city, country: where?.country ?? null, confidence,
    };
  }
  if (dryRun || !db) continue;

  // Keep the original row (price, class, booking channel) on a source item.
  const externalId = `sheet:${r.Type}:${date}:${code ?? ''}:${leg.number ?? leg.hotel_name ?? ''}`;
  const { data: src } = await db.from('sources').select('id').eq('slug', 'manual').single();
  const { data: item, error } = await db
    .from('source_items')
    .upsert({ owner_id: owner, source_id: src!.id, external_id: externalId, payload: r }, { onConflict: 'source_id,external_id' })
    .select('id')
    .single();
  if (error) throw error;
  const res = await applyTravel(db, owner, item.id, { kind: leg.kind, confidence, notes: null, legs: [leg] }, 'travel_sheet');
  counts.written += res.written;
  counts.queued += res.queued;
  counts.notes.push(...res.notes);
  await db.from('source_items').update({ processed_at: new Date().toISOString() }).eq('id', item.id);
}

if (db) await rebuildTrips(db, owner);
console.log(JSON.stringify({ dryRun, rows: rows.length, ...counts, notes: counts.notes.slice(0, 15) }, null, 2));
