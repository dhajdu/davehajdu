import type { SupabaseClient } from '@supabase/supabase-js';

// W5 trip builder. groupTrips() and friends are pure (no runtime imports) so
// scripts/life/test-travel.ts can run them under `node --experimental-strip-types`.
// rebuildTrips() reads every leg for the owner and rewrites trips, leg
// assignments, trip->entry links and monthly measurements. It is idempotent.

export interface TripLeg {
  id: string;
  kind: 'flight' | 'hotel' | 'train' | 'car' | 'event';
  status: 'confirmed' | 'changed' | 'cancelled';
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  // Where the leg takes you: hotel city, or the destination airport's city.
  city: string | null;
  trip_id: string | null;
}

export interface PlannedTrip {
  legIds: string[];
  start_on: string;
  end_on: string;
  closed: boolean;
  primary_city: string | null;
  primary_leg_id: string | null;
  title: string;
  nights: number;
}

export interface GroupOptions {
  home: string;
  homeCities: string[];
  maxGapDays?: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DEFAULT_MAX_GAP_DAYS = 60;

export const SAIGON_ALIASES = ['ho chi minh city', 'ho chi minh', 'saigon', 'sai gon', 'hcmc', 'thanh pho ho chi minh'];

function localDate(iso: string, tz: string | null): string {
  try {
    if (tz) {
      return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
    }
  } catch {
    // fall through to UTC date
  }
  return new Date(iso).toISOString().slice(0, 10);
}

function dayNumber(date: string): number {
  return Math.round(Date.parse(`${date}T00:00:00Z`) / 86400000);
}

function addDays(date: string, n: number): string {
  return new Date((dayNumber(date) + n) * 86400000).toISOString().slice(0, 10);
}

const normCity = (c: string | null | undefined) =>
  (c ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function tripTitle(city: string | null, startOn: string): string {
  const [y, m] = startOn.split('-');
  return `${city ?? 'Trip'}, ${MONTHS[Number(m) - 1]} ${y}`;
}

// Nights per month, keyed by the first day of the month ("2026-03-01").
export function nightsByMonth(startOn: string, endOn: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (let d = startOn; d < endOn; d = addDays(d, 1)) {
    const key = `${d.slice(0, 7)}-01`;
    out[key] = (out[key] ?? 0) + 1;
  }
  return out;
}

export function groupTrips(legs: TripLeg[], opts: GroupOptions): { trips: PlannedTrip[]; unassigned: string[] } {
  const home = opts.home.toUpperCase();
  const homeCities = new Set(opts.homeCities.map(normCity));
  const maxGap = opts.maxGapDays ?? DEFAULT_MAX_GAP_DAYS;

  const active = legs
    .filter((l) => l.status !== 'cancelled')
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.id.localeCompare(b.id));

  const trips: PlannedTrip[] = [];
  const unassigned: string[] = [];
  let cur: { legs: TripLeg[]; lastEnd: string; closedOn: string | null } | null = null;

  const start = (l: TripLeg) => localDate(l.starts_at, l.start_tz);
  const end = (l: TripLeg) => (l.ends_at ? localDate(l.ends_at, l.end_tz ?? l.start_tz) : start(l));

  const finalize = () => {
    if (!cur) return;
    const first = cur.legs[0];
    const startOn = start(first);
    const endOn = cur.closedOn ?? cur.legs.map(end).reduce((a, b) => (a > b ? a : b), startOn);

    // Primary city: most hotel nights, else first destination away from home.
    const hotelNights = new Map<string, { nights: number; city: string; legId: string; order: number }>();
    cur.legs.forEach((l, i) => {
      if (l.kind !== 'hotel' || !l.city) return;
      const k = normCity(l.city);
      const n = Math.max(0, dayNumber(end(l)) - dayNumber(start(l)));
      const prev = hotelNights.get(k);
      hotelNights.set(k, { nights: (prev?.nights ?? 0) + n, city: prev?.city ?? l.city, legId: prev?.legId ?? l.id, order: prev?.order ?? i });
    });
    let primary: { city: string; legId: string } | null = null;
    if (hotelNights.size) {
      const best = [...hotelNights.values()].sort((a, b) => b.nights - a.nights || a.order - b.order)[0];
      primary = { city: best.city, legId: best.legId };
    } else {
      // No hotels: the destination where the most time passes before the next leg,
      // so a Doha connection does not beat a week in London. Ties go to the first.
      let best: { legId: string; city: string; stay: number } | null = null;
      cur.legs.forEach((l, i) => {
        if (!l.city || homeCities.has(normCity(l.city))) return;
        const arrived = Date.parse(l.ends_at ?? l.starts_at);
        const next = cur!.legs[i + 1];
        const stay = next ? Date.parse(next.starts_at) - arrived : 0;
        if (!best || stay > best.stay) best = { legId: l.id, city: l.city, stay };
      });
      const firstAny = cur.legs.find((l) => l.city);
      const pick = (best as { legId: string; city: string } | null) ?? (firstAny?.city ? { legId: firstAny.id, city: firstAny.city } : null);
      if (pick) primary = { city: pick.city, legId: pick.legId };
    }

    trips.push({
      legIds: cur.legs.map((l) => l.id),
      start_on: startOn,
      end_on: endOn,
      closed: cur.closedOn !== null,
      primary_city: primary?.city ?? null,
      primary_leg_id: primary?.legId ?? null,
      title: tripTitle(primary?.city ?? null, startOn),
      nights: Math.max(0, dayNumber(endOn) - dayNumber(startOn)),
    });
    cur = null;
  };

  for (const l of active) {
    const sd = start(l);
    if (cur && dayNumber(sd) - dayNumber(cur.lastEnd) > maxGap) finalize();

    const departsHome = l.kind === 'flight' && l.origin_iata?.toUpperCase() === home;
    const arrivesHome = l.kind === 'flight' && l.destination_iata?.toUpperCase() === home;
    const atHome = l.kind !== 'flight' && homeCities.has(normCity(l.city));

    if (departsHome) {
      finalize(); // a previous trip with no recorded return closes here
      cur = { legs: [l], lastEnd: end(l), closedOn: null };
    } else if (arrivesHome) {
      if (cur) {
        cur.legs.push(l);
        cur.closedOn = end(l);
        finalize();
      } else {
        unassigned.push(l.id);
      }
    } else if (atHome) {
      if (cur) {
        cur.legs.push(l);
        cur.lastEnd = end(l) > cur.lastEnd ? end(l) : cur.lastEnd;
      } else {
        unassigned.push(l.id);
      }
    } else if (cur) {
      cur.legs.push(l);
      cur.lastEnd = end(l) > cur.lastEnd ? end(l) : cur.lastEnd;
    } else {
      // Away from home with nothing open (e.g. outbound flight not on file).
      cur = { legs: [l], lastEnd: end(l), closedOn: null };
    }
  }
  finalize();

  for (const l of legs) if (l.status === 'cancelled') unassigned.push(l.id);
  return { trips, unassigned };
}

export interface ExistingTrip {
  id: string;
  start_on: string;
  end_on: string | null;
}

// Pick a stable id for each planned trip: the existing trip most of its legs
// already belong to, else one whose dates overlap, else null (create).
export function matchExistingTrips(planned: PlannedTrip[], existing: ExistingTrip[], legTrip: Map<string, string | null>): (string | null)[] {
  const used = new Set<string>();
  const valid = new Set(existing.map((t) => t.id));
  return planned.map((p) => {
    const counts = new Map<string, number>();
    for (const id of p.legIds) {
      const t = legTrip.get(id);
      if (t && valid.has(t) && !used.has(t)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    let pick: string | null = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;
    if (!pick) {
      pick = existing.find((t) => !used.has(t.id) && t.start_on <= p.end_on && (t.end_on ?? t.start_on) >= p.start_on)?.id ?? null;
    }
    if (pick) used.add(pick);
    return pick;
  });
}

// ---------- database side ----------

const PAGE = 1000;
const CHUNK = 200;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: any; error: any }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE) return out;
  }
}

function chunks<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

interface LegRow {
  id: string;
  kind: TripLeg['kind'];
  status: TripLeg['status'];
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  trip_id: string | null;
  origin_place_id: string | null;
  destination_place_id: string | null;
  raw: { city?: string | null } | null;
}

interface PlaceRow {
  id: string;
  iata: string | null;
  city: string | null;
}

export async function rebuildTrips(db: SupabaseClient, ownerId: string): Promise<void> {
  const home = (process.env.HOME_AIRPORT || 'SGN').toUpperCase();

  const [legRows, places, existingTrips] = await Promise.all([
    fetchAll<LegRow>((a, b) =>
      db
        .from('trip_legs')
        .select('id,kind,status,starts_at,start_tz,ends_at,end_tz,trip_id,origin_place_id,destination_place_id,raw')
        .eq('owner_id', ownerId)
        .order('id')
        .range(a, b)
    ),
    fetchAll<PlaceRow>((a, b) => db.from('places').select('id,iata,city').eq('owner_id', ownerId).order('id').range(a, b)),
    fetchAll<ExistingTrip & { title: string; title_locked: boolean; primary_place_id: string | null }>((a, b) =>
      db.from('trips').select('id,start_on,end_on,title,title_locked,primary_place_id').eq('owner_id', ownerId).order('id').range(a, b)
    ),
  ]);

  const placeById = new Map(places.map((p) => [p.id, p]));
  const homeCities = [...SAIGON_ALIASES];
  const homePlace = places.find((p) => p.iata === home);
  if (homePlace?.city) homeCities.push(homePlace.city);

  const legs: TripLeg[] = legRows.map((r) => {
    const origin = r.origin_place_id ? placeById.get(r.origin_place_id) : undefined;
    const dest = r.destination_place_id ? placeById.get(r.destination_place_id) : undefined;
    return {
      id: r.id,
      kind: r.kind,
      status: r.status,
      starts_at: r.starts_at,
      start_tz: r.start_tz,
      ends_at: r.ends_at,
      end_tz: r.end_tz,
      origin_iata: origin?.iata ?? null,
      destination_iata: dest?.iata ?? null,
      city: dest?.city ?? r.raw?.city ?? null,
      trip_id: r.trip_id,
    };
  });
  const legById = new Map(legRows.map((r) => [r.id, r]));

  const { trips: planned } = groupTrips(legs, { home, homeCities });
  const legTrip = new Map(legs.map((l) => [l.id, l.trip_id]));
  const matched = matchExistingTrips(planned, existingTrips, legTrip);
  const existingById = new Map(existingTrips.map((t) => [t.id, t]));

  // 1. Upsert trips.
  const finalIds: string[] = [];
  for (let i = 0; i < planned.length; i++) {
    const p = planned[i];
    const primaryLeg = p.primary_leg_id ? legById.get(p.primary_leg_id) : undefined;
    const primaryPlaceId = primaryLeg?.destination_place_id ?? null;
    const id = matched[i];
    if (id) {
      const t = existingById.get(id)!;
      const patch: Record<string, unknown> = {};
      if (t.start_on !== p.start_on) patch.start_on = p.start_on;
      if (t.end_on !== p.end_on) patch.end_on = p.end_on;
      if (!t.title_locked) {
        if (t.title !== p.title) patch.title = p.title;
        if (t.primary_place_id !== primaryPlaceId) patch.primary_place_id = primaryPlaceId;
      }
      if (Object.keys(patch).length) check((await db.from('trips').update(patch).eq('id', id)).error);
      finalIds.push(id);
    } else {
      const { data, error } = await db
        .from('trips')
        .insert({ owner_id: ownerId, title: p.title, start_on: p.start_on, end_on: p.end_on, primary_place_id: primaryPlaceId })
        .select('id')
        .single();
      check(error);
      finalIds.push((data as { id: string }).id);
    }
  }

  // 2. Point legs at their trip (null for cancelled / unassigned legs).
  const desired = new Map<string, string | null>(legs.map((l) => [l.id, null]));
  planned.forEach((p, i) => p.legIds.forEach((id) => desired.set(id, finalIds[i])));
  const byTarget = new Map<string | null, string[]>();
  for (const [legId, target] of desired) {
    if (legTrip.get(legId) === target) continue;
    const list = byTarget.get(target) ?? [];
    list.push(legId);
    byTarget.set(target, list);
  }
  for (const [target, ids] of byTarget) {
    for (const part of chunks(ids)) check((await db.from('trip_legs').update({ trip_id: target }).in('id', part)).error);
  }

  // 3. Remove derived trips that lost all their legs (never a locked or manual trip).
  const kept = new Set(finalIds);
  const hadLegs = new Set(legs.map((l) => l.trip_id).filter((t): t is string => !!t));
  const orphaned = existingTrips.filter((t) => !kept.has(t.id) && hadLegs.has(t.id) && !t.title_locked).map((t) => t.id);
  for (const part of chunks(orphaned)) {
    check((await db.from('links').delete().eq('from_type', 'trips').in('from_id', part)).error);
    check((await db.from('trips').delete().in('id', part)).error);
  }

  // 4. trip --during--> entries dated inside the trip.
  const entries = await fetchAll<{ id: string; entry_date: string; kind: string }>((a, b) =>
    db.from('entries').select('id,entry_date,kind').eq('owner_id', ownerId).neq('kind', 'reference').order('id').range(a, b)
  );
  const wanted = new Set<string>();
  const wantedRows: Record<string, unknown>[] = [];
  planned.forEach((p, i) => {
    for (const e of entries) {
      if (e.entry_date >= p.start_on && e.entry_date <= p.end_on) {
        wanted.add(`${finalIds[i]}|${e.id}`);
        wantedRows.push({ owner_id: ownerId, from_type: 'trips', from_id: finalIds[i], to_type: 'entries', to_id: e.id, relation: 'during' });
      }
    }
  });
  const existingLinks = await fetchAll<{ id: string; from_id: string; to_id: string }>((a, b) =>
    db
      .from('links')
      .select('id,from_id,to_id')
      .eq('owner_id', ownerId)
      .eq('from_type', 'trips')
      .eq('to_type', 'entries')
      .eq('relation', 'during')
      .order('id')
      .range(a, b)
  );
  const have = new Set(existingLinks.map((l) => `${l.from_id}|${l.to_id}`));
  const stale = existingLinks.filter((l) => !wanted.has(`${l.from_id}|${l.to_id}`)).map((l) => l.id);
  for (const part of chunks(stale)) check((await db.from('links').delete().in('id', part)).error);
  const missing = wantedRows.filter((r) => !have.has(`${r.from_id}|${r.to_id}`));
  for (const part of chunks(missing, 500)) {
    check(
      (await db.from('links').upsert(part, { onConflict: 'from_type,from_id,to_type,to_id,relation', ignoreDuplicates: true })).error
    );
  }

  // 5. Monthly measurements: nights_away (nights per month) and trips (trips started per month).
  const { data: metricRows, error: metricErr } = await db.from('metrics').select('id,slug').in('slug', ['nights_away', 'trips']);
  check(metricErr);
  const metricId = new Map((metricRows ?? []).map((m: { id: string; slug: string }) => [m.slug, m.id]));
  const nightsId = metricId.get('nights_away');
  const tripsId = metricId.get('trips');
  if (!nightsId || !tripsId) throw new Error('metrics nights_away / trips are not seeded');

  const nights: Record<string, number> = {};
  const counts: Record<string, number> = {};
  for (const p of planned) {
    for (const [month, n] of Object.entries(nightsByMonth(p.start_on, p.end_on))) nights[month] = (nights[month] ?? 0) + n;
    const m = `${p.start_on.slice(0, 7)}-01`;
    counts[m] = (counts[m] ?? 0) + 1;
  }
  const prior = await fetchAll<{ metric_id: string; measured_on: string; value: number }>((a, b) =>
    db
      .from('measurements')
      .select('metric_id,measured_on,value')
      .eq('owner_id', ownerId)
      .in('metric_id', [nightsId, tripsId])
      .order('measured_on')
      .range(a, b)
  );
  const rows = new Map<string, Record<string, unknown>>();
  const put = (metric: string, month: string, value: number) =>
    rows.set(`${metric}|${month}`, { owner_id: ownerId, metric_id: metric, measured_on: month, value });
  for (const p of prior) put(p.metric_id, p.measured_on, 0); // months that no longer have trips go to zero
  for (const [m, n] of Object.entries(nights)) put(nightsId, m, n);
  for (const [m, n] of Object.entries(counts)) put(tripsId, m, n);
  const priorValue = new Map(prior.map((p) => [`${p.metric_id}|${p.measured_on}`, Number(p.value)]));
  const changed = [...rows.entries()].filter(([k, r]) => priorValue.get(k) !== r.value).map(([, r]) => r);
  for (const part of chunks(changed, 500)) {
    check((await db.from('measurements').upsert(part, { onConflict: 'owner_id,metric_id,measured_on' })).error);
  }
}
