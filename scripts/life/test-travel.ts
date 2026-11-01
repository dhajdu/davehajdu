// Offline tests for travel extraction plumbing (no network, no database).
//   node --experimental-strip-types scripts/life/test-travel.ts
import assert from 'node:assert/strict';
import * as nodeModule from 'node:module';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
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
const L = await import('../../src/lib/life/extract/legs');
const A = await import('../../src/lib/life/extract/airports');
const I = await import('../../src/lib/life/extract/ical');
const T = await import('../../src/lib/life/trips');
import type { ComparableLeg, ExtractedLeg, ResolvedLeg, TravelExtraction } from '../../src/lib/life/extract/legs';
import type { TripLeg } from '../../src/lib/life/trips';

let passed = 0;
const failures: string[] = [];
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failures.push(`${name}\n    ${(e as Error).message.split('\n').join('\n    ')}`);
  }
}

const tz = (iata: string) => A.airportInfo(iata)?.tz ?? null;
const resolve = (x: ExtractedLeg): ResolvedLeg => {
  const r = L.resolveLeg(x, tz);
  assert.ok(r.leg, `leg did not resolve: ${r.problems.join('; ')}`);
  return r.leg!;
};
const cmp = (l: ResolvedLeg): ComparableLeg => l;
const conflictOpts = { home: 'SGN', isKnownAirport: (c: string) => !!A.AIRPORTS[c] };

// ---------- fixtures ----------
const fixDir = new URL('../../src/lib/life/extract/__fixtures__/', import.meta.url);
const names = readdirSync(fixDir).filter((f) => f.endsWith('.email.json')).map((f) => f.replace('.email.json', '')).sort();
const fx: Record<string, { email: { from: string; subject: string; body_text: string; received_at: string }; expected: TravelExtraction }> = {};
for (const n of names) {
  fx[n] = {
    email: JSON.parse(readFileSync(new URL(`${n}.email.json`, fixDir), 'utf8')),
    expected: JSON.parse(readFileSync(new URL(`${n}.expected.json`, fixDir), 'utf8')),
  };
}

test('six fixtures, each with email and expected extraction', () => {
  assert.equal(names.length, 6);
  for (const n of names) {
    const { email, expected } = fx[n];
    assert.ok(email.subject && email.body_text && email.from, `${n} email incomplete`);
    assert.ok(['flight', 'hotel', 'change', 'cancellation'].includes(expected.kind), `${n} kind`);
    assert.ok(expected.legs.length > 0, `${n} has legs`);
    for (const l of expected.legs) resolve(l);
  }
});

// ---------- leg_key ----------
test('leg_key is kind|confirmation|number|local date, upper-case', () => {
  const vn = fx['01-vn-flight'].expected.legs[0];
  assert.equal(L.legKey(vn), 'FLIGHT|K7Q2ZP|VN773|2026-03-14');
  assert.equal(L.legKey({ ...vn, number: 'vn 0773', confirmation_code: 'k7q2zp' }), 'FLIGHT|K7Q2ZP|VN773|2026-03-14');
  const h = fx['02-marriott-hotel'].expected.legs[0];
  assert.equal(L.legKey(h), 'HOTEL|81234567|SYDNEY HARBOUR MARRIOTT HOTEL AT CIRCULAR QUAY|2026-03-15');
  assert.equal(L.legKey({ ...vn, confirmation_code: null }), 'FLIGHT||VN773|2026-03-14');
});

test('local date in leg_key uses departure local time, not UTC', () => {
  // 23:55 in Saigon is 16:55Z the same day; 06:30 in Sydney is the previous day in UTC.
  const syd = { ...fx['01-vn-flight'].expected.legs[1], starts_at_local: '2026-03-22T06:30' };
  assert.ok(L.legKey(syd).endsWith('|2026-03-22'));
  assert.equal(resolve(syd).starts_at, '2026-03-21T19:30:00.000Z');
});

test('timezone conversion handles DST', () => {
  assert.equal(L.localToUtc('2026-03-14T23:55', 'Asia/Ho_Chi_Minh'), '2026-03-14T16:55:00.000Z');
  assert.equal(L.localToUtc('2026-03-15T11:10', 'Australia/Sydney'), '2026-03-15T00:10:00.000Z'); // AEDT +11
  assert.equal(L.localToUtc('2026-05-04T07:05', 'Europe/London'), '2026-05-04T06:05:00.000Z'); // BST +1
  assert.equal(L.localToUtc('2026-01-10T07:05', 'Europe/London'), '2026-01-10T07:05:00.000Z');
  assert.equal(L.utcToLocalDate('2026-03-14T16:55:00Z', 'Asia/Ho_Chi_Minh'), '2026-03-14');
  assert.equal(L.localToUtc('2026-03-14T23:55', 'Not/AZone'), null);
});

test('flight without explicit tz falls back to the airport map', () => {
  const x = { ...fx['01-vn-flight'].expected.legs[0], start_tz: null, end_tz: null };
  const r = resolve(x);
  assert.equal(r.start_tz, 'Asia/Ho_Chi_Minh');
  assert.equal(r.end_tz, 'Australia/Sydney');
});

test('airport map has ~60+ entries with valid zones', () => {
  const codes = Object.keys(A.AIRPORTS);
  assert.ok(codes.length >= 60, `${codes.length} airports`);
  for (const c of codes) assert.ok(L.isValidTz(A.AIRPORTS[c].tz), `${c} tz ${A.AIRPORTS[c].tz}`);
});

// ---------- conflicts ----------
const marriott = resolve(fx['02-marriott-hotel'].expected.legs[0]);
const agoda = resolve(fx['03-agoda-hotel'].expected.legs[0]);
const [vn773, vn772] = fx['01-vn-flight'].expected.legs.map(resolve);

test('overlapping hotel nights in different hotels is a conflict', () => {
  const reasons = L.detectConflicts(cmp(agoda), [cmp(marriott), cmp(vn773), cmp(vn772)], conflictOpts);
  assert.equal(reasons.length, 1, reasons.join('; '));
  assert.match(reasons[0], /overlapping hotel nights/);
});

test('same hotel re-sent, back-to-back stays and cancelled stays are not conflicts', () => {
  assert.deepEqual(L.detectConflicts(cmp(marriott), [cmp(marriott)], conflictOpts), []);
  const next = { ...agoda, leg_key: 'X', starts_at: L.localToUtc('2026-03-21T14:00', 'Australia/Sydney')! };
  assert.deepEqual(L.detectConflicts(cmp(next), [cmp(marriott)], conflictOpts), []);
  assert.deepEqual(L.detectConflicts(cmp(agoda), [{ ...cmp(marriott), status: 'cancelled' }], conflictOpts), []);
});

test('two return flights home on the same trip is a conflict', () => {
  const other = resolve({ ...fx['01-vn-flight'].expected.legs[1], number: 'VN778', confirmation_code: 'ZZ9ZZ9', starts_at_local: '2026-03-24T10:00', ends_at_local: '2026-03-24T16:00' });
  const reasons = L.detectConflicts(cmp(other), [cmp(vn773), cmp(vn772)], conflictOpts);
  assert.equal(reasons.length, 1, reasons.join('; '));
  assert.match(reasons[0], /second return flight/);
  // A departure from home between the two returns makes them separate trips.
  const out = resolve({ ...vn773, starts_at_local: '2026-03-23T08:00', ends_at_local: '2026-03-23T19:00', number: 'VN771', confirmation_code: 'Q1Q1Q1', start_tz: 'Asia/Ho_Chi_Minh', end_tz: 'Australia/Sydney', status: 'confirmed', origin_city: null, destination_city: null, address: null, hotel_name: null } as ExtractedLeg);
  assert.deepEqual(L.detectConflicts(cmp(other), [cmp(vn773), cmp(vn772), cmp(out)], conflictOpts), []);
});

test('unknown airport is a conflict', () => {
  const x = resolve({ ...fx['01-vn-flight'].expected.legs[0], destination_iata: 'XQZ', end_tz: 'Australia/Sydney' });
  assert.deepEqual(L.detectConflicts(cmp(x), [], conflictOpts), ['unknown airport XQZ']);
  assert.deepEqual(L.detectConflicts(cmp(vn773), [], conflictOpts), []);
});

test('Qatar multi-leg booking has no conflicts and four distinct keys', () => {
  const legs = fx['06-qatar-multileg'].expected.legs.map(resolve);
  assert.equal(new Set(legs.map((l) => l.leg_key)).size, 4);
  legs.forEach((l, i) => assert.deepEqual(L.detectConflicts(cmp(l), legs.filter((_, j) => j < i).map(cmp), conflictOpts), [], l.leg_key));
});

// ---------- iCal ----------
const ICS = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//TripIt//synthetic//EN',
  'BEGIN:VEVENT',
  'UID:trip-1@tripit.test',
  'DTSTART;VALUE=DATE:20260314',
  'DTEND;VALUE=DATE:20260324',
  'SUMMARY:Sydney\\, Australia\\, March 2026',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:air-773@tripit.test',
  'DTSTART:20260314T165500Z',
  'DTEND:20260315T001000Z',
  'SUMMARY:VN773 SGN to SYD',
  'DESCRIPTION:[Flight] Vietnam Airlines(VN) #773\\nConfirmation #: K7Q2ZP\\nde',
  ' p SGN 11:55pm arr SYD 11:10am',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:air-773@tripit.test',
  'DTSTART:20260314T165500Z',
  'DTEND:20260315T001000Z',
  'SUMMARY:VN773 SGN to SYD',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:lodging-in@tripit.test',
  'DTSTART;TZID=Australia/Sydney:20260315T150000',
  'DTEND;TZID=Australia/Sydney:20260315T160000',
  'SUMMARY:Check-in: Sydney Harbour Marriott',
  'LOCATION:30 Pitt Street\\, Sydney',
  'DESCRIPTION:Confirmation #: 81234567',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:lodging-out@tripit.test',
  'DTSTART;TZID=Australia/Sydney:20260321T110000',
  'DTEND;TZID=Australia/Sydney:20260321T120000',
  'SUMMARY:Check-out: Sydney Harbour Marriott',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:air-772@tripit.test',
  'DTSTART:20260323T223000Z',
  'DTEND:20260324T082500Z',
  'SUMMARY:VN 772 SYD to SGN',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

test('iCal parse: unfolding, escapes, DATE / TZID / Z start times', () => {
  const ev = I.parseIcal(ICS);
  assert.equal(ev.length, 6);
  assert.equal(ev[0].summary, 'Sydney, Australia, March 2026');
  assert.deepEqual(ev[0].start, { value: '2026-03-14', tz: null, utc: false, allDay: true });
  assert.ok(ev[1].description.includes('dep SGN 11:55pm'), 'folded line rejoined');
  assert.ok(ev[1].description.includes('\nConfirmation #: K7Q2ZP'));
  assert.deepEqual(ev[1].start, { value: '2026-03-14T16:55:00', tz: 'UTC', utc: true, allDay: false });
  assert.deepEqual(ev[3].start, { value: '2026-03-15T15:00:00', tz: 'Australia/Sydney', utc: false, allDay: false });
  assert.equal(ev[3].location, '30 Pitt Street, Sydney');
});

test('iCal dedupe and mapping to legs, skipping the trip summary', () => {
  const ev = I.dedupeEvents(I.parseIcal(ICS));
  assert.equal(ev.length, 5);
  const { legs, skipped } = I.icalToLegs(ev, (c: string) => A.airportInfo(c));
  assert.deepEqual(skipped, ['trip-1@tripit.test']);
  assert.equal(legs.length, 3);
  const f = legs.find((l) => l.external_id === 'air-773@tripit.test')!.leg;
  assert.equal(f.number, 'VN773');
  assert.equal(f.confirmation_code, 'K7Q2ZP');
  assert.equal(f.starts_at_local, '2026-03-14T23:55');
  assert.equal(f.start_tz, 'Asia/Ho_Chi_Minh');
  assert.equal(f.ends_at_local, '2026-03-15T11:10');
  assert.equal(L.legKey(f), L.legKey(fx['01-vn-flight'].expected.legs[0]), 'TripIt and Gmail produce the same key');
  const h = legs.find((l) => l.external_id === 'lodging-in@tripit.test')!.leg;
  assert.equal(h.kind, 'hotel');
  assert.equal(h.hotel_name, 'Sydney Harbour Marriott');
  assert.equal(h.ends_at_local, '2026-03-21T11:00');
  assert.equal(h.city, 'Sydney');
  const r = legs.find((l) => l.external_id === 'air-772@tripit.test')!.leg;
  assert.equal(r.number, 'VN772');
  assert.equal(r.starts_at_local, '2026-03-24T09:30');
});

// ---------- trip grouping ----------
// Replays the fixtures in arrival order the way apply-travel does, in memory.
function replayFixtures(): TripLeg[] {
  const store = new Map<string, ResolvedLeg>();
  for (const n of names) {
    const x = fx[n].expected;
    for (const leg of x.legs) {
      if (x.kind === 'cancellation') {
        for (const [k, s] of store) if (s.confirmation_code === leg.confirmation_code) store.set(k, { ...s, status: 'cancelled' });
      } else if (x.kind === 'change') {
        const r = resolve(leg);
        for (const [k, s] of store) {
          if (s.confirmation_code === r.confirmation_code && s.number === r.number) store.delete(k);
        }
        store.set(r.leg_key, r);
      } else {
        const r = resolve(leg);
        store.set(r.leg_key, r);
      }
    }
  }
  return [...store.values()].map((l, i) => ({
    id: `leg-${String(i).padStart(2, '0')}`,
    kind: l.kind,
    status: l.status,
    starts_at: l.starts_at,
    start_tz: l.start_tz,
    ends_at: l.ends_at,
    end_tz: l.end_tz,
    origin_iata: l.origin_iata,
    destination_iata: l.destination_iata,
    city: l.kind === 'flight' ? A.airportInfo(l.destination_iata)?.city ?? null : l.city,
    trip_id: null,
  }));
}
const groupOpts = { home: 'SGN', homeCities: T.SAIGON_ALIASES };

test('fixtures group into two trips with correct dates, titles and nights', () => {
  const legs = replayFixtures();
  const { trips, unassigned } = T.groupTrips(legs, groupOpts);
  assert.equal(trips.length, 2, JSON.stringify(trips, null, 2));
  const [syd, lon] = trips;
  assert.equal(syd.start_on, '2026-03-14');
  assert.equal(syd.end_on, '2026-03-23', 'schedule change moved the return');
  assert.equal(syd.title, 'Sydney, Mar 2026');
  assert.equal(syd.nights, 9);
  assert.equal(syd.closed, true);
  assert.equal(syd.legIds.length, 3, 'VN773, Marriott, changed VN772 (Agoda cancelled)');
  assert.equal(lon.start_on, '2026-05-03');
  assert.equal(lon.end_on, '2026-05-13');
  assert.equal(lon.title, 'London, May 2026', 'Doha connection is not the primary city');
  assert.equal(lon.legIds.length, 4);
  assert.equal(unassigned.length, 1, 'cancelled Agoda leg');
});

test('grouping is order-independent and idempotent', () => {
  const legs = replayFixtures();
  const a = T.groupTrips(legs, groupOpts);
  const b = T.groupTrips([...legs].reverse(), groupOpts);
  assert.deepEqual(a, b);
});

test('hotel abroad with no open trip opens one; Saigon hotel does not', () => {
  const h = (id: string, city: string, inD: string, outD: string, zone: string): TripLeg => ({
    id, kind: 'hotel', status: 'confirmed', city, origin_iata: null, destination_iata: null, trip_id: null,
    starts_at: L.localToUtc(`${inD}T15:00`, zone)!, start_tz: zone, ends_at: L.localToUtc(`${outD}T11:00`, zone)!, end_tz: zone,
  });
  const { trips, unassigned } = T.groupTrips(
    [h('a', 'Ho Chi Minh City', '2026-07-01', '2026-07-02', 'Asia/Ho_Chi_Minh'), h('b', 'Bangkok', '2026-07-10', '2026-07-13', 'Asia/Bangkok')],
    groupOpts
  );
  assert.deepEqual(unassigned, ['a']);
  assert.equal(trips.length, 1);
  assert.equal(trips[0].title, 'Bangkok, Jul 2026');
  assert.equal(trips[0].nights, 3);
});

test('a departure from home with no recorded return closes at the next departure', () => {
  const legs = replayFixtures().filter((l) => !(l.kind === 'flight' && l.destination_iata === 'SGN' && l.starts_at < '2026-04-01'));
  const { trips } = T.groupTrips(legs, groupOpts);
  assert.equal(trips.length, 2);
  assert.equal(trips[0].closed, false);
  assert.equal(trips[0].end_on, '2026-03-21', 'last known leg end (Marriott check-out)');
});

test('nightsByMonth splits across months', () => {
  assert.deepEqual(T.nightsByMonth('2026-03-29', '2026-04-02'), { '2026-03-01': 3, '2026-04-01': 1 });
  assert.deepEqual(T.nightsByMonth('2026-03-29', '2026-03-29'), {});
});

test('matchExistingTrips keeps ids stable by leg membership, then by overlap', () => {
  const legs = replayFixtures();
  const { trips } = T.groupTrips(legs, groupOpts);
  const legTrip = new Map<string, string | null>(legs.map((l) => [l.id, null]));
  for (const id of trips[0].legIds) legTrip.set(id, 'trip-A');
  const ids = T.matchExistingTrips(
    trips,
    [{ id: 'trip-A', start_on: '2026-03-14', end_on: '2026-03-22' }, { id: 'trip-B', start_on: '2026-05-05', end_on: '2026-05-06' }],
    legTrip
  );
  assert.deepEqual(ids, ['trip-A', 'trip-B']);
  assert.deepEqual(T.matchExistingTrips(trips, [], legTrip), [null, null]);
});

console.log(`${passed} passed, ${failures.length} failed`);
for (const f of failures) console.log(`FAIL ${f}`);
if (failures.length) process.exit(1);
