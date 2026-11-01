// Pure travel-leg logic: types, leg_key, timezone maths, conflict detection.
// No runtime imports (only types), so `node --experimental-strip-types` can
// load it directly from scripts/life/test-travel.ts.

export type LegKind = 'flight' | 'hotel' | 'train' | 'car' | 'event';
export type EmailKind = LegKind | 'cancellation' | 'change' | 'not_travel';
export type LegStatus = 'confirmed' | 'changed' | 'cancelled';

// One leg as Claude (or the iCal mapper) returns it. Times are LOCAL wall-clock
// ISO strings ("2026-03-14T23:55") with the IANA zone alongside.
export interface ExtractedLeg {
  kind: LegKind;
  status: LegStatus;
  confirmation_code: string | null;
  provider: string | null;
  number: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  origin_city: string | null;
  destination_city: string | null;
  starts_at_local: string;
  start_tz: string | null;
  ends_at_local: string | null;
  end_tz: string | null;
  hotel_name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  confidence: number;
}

export interface TravelExtraction {
  kind: EmailKind;
  confidence: number;
  notes: string | null;
  legs: ExtractedLeg[];
}

// A leg resolved to UTC, ready to compare with stored legs or write.
export interface ResolvedLeg {
  leg_key: string;
  kind: LegKind;
  status: LegStatus;
  confirmation_code: string | null;
  provider: string | null;
  number: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  hotel_name: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  confidence: number;
}

export const CONFIDENCE_THRESHOLD = 0.8;

// ---------- normalisation and leg_key ----------

function norm(s: string | null | undefined): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
}

export function normalizeFlightNumber(n: string | null | undefined): string | null {
  if (!n) return null;
  // "VN 773", "vn0773" -> "VN773"
  const m = n.trim().toUpperCase().replace(/\s+/g, '').match(/^([A-Z0-9]{2})0*(\d{1,4})([A-Z]?)$/);
  return m ? `${m[1]}${m[2]}${m[3]}` : n.trim().toUpperCase().replace(/\s+/g, '');
}

export function normalizeHotelName(n: string | null | undefined): string {
  return norm(n).replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

// leg_key = kind|confirmation_code|number|local start date (upper-case).
// For hotels the "number" is the hotel name.
export function legKey(leg: {
  kind: LegKind;
  confirmation_code: string | null;
  number: string | null;
  hotel_name?: string | null;
  starts_at_local: string;
}): string {
  const number =
    leg.kind === 'hotel'
      ? normalizeHotelName(leg.hotel_name ?? leg.number)
      : leg.kind === 'flight'
        ? normalizeFlightNumber(leg.number) ?? ''
        : norm(leg.number);
  const date = leg.starts_at_local.slice(0, 10);
  return [norm(leg.kind), norm(leg.confirmation_code), number, date].join('|');
}

// ---------- timezone maths (Intl only, no deps) ----------

export function isValidTz(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p: Record<string, number> = {};
  for (const part of dtf.formatToParts(new Date(utcMs))) {
    if (part.type !== 'literal') p[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

function parseLocal(local: string): number | null {
  const m = local.trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!m) return null;
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
}

// "2026-03-14T23:55" in "Asia/Ho_Chi_Minh" -> "2026-03-14T16:55:00.000Z"
export function localToUtc(local: string, tz: string): string | null {
  const guess = parseLocal(local);
  if (guess === null || !isValidTz(tz)) return null;
  const off1 = tzOffsetMs(guess, tz);
  let t = guess - off1;
  const off2 = tzOffsetMs(t, tz);
  if (off2 !== off1) t = guess - off2;
  return new Date(t).toISOString();
}

// UTC instant -> local calendar date "YYYY-MM-DD" in tz.
export function utcToLocalDate(iso: string, tz: string | null | undefined): string {
  const d = new Date(iso);
  if (!isValidTz(tz)) return d.toISOString().slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

// ---------- resolving an extracted leg ----------

export interface ResolveResult {
  leg: ResolvedLeg | null;
  problems: string[];
}

// tzForIata: returns the IANA zone for an airport, or null if unknown.
export function resolveLeg(x: ExtractedLeg, tzForIata: (iata: string) => string | null): ResolveResult {
  const problems: string[] = [];
  const origin = x.origin_iata ? x.origin_iata.trim().toUpperCase() : null;
  const dest = x.destination_iata ? x.destination_iata.trim().toUpperCase() : null;

  let startTz = isValidTz(x.start_tz) ? x.start_tz : null;
  let endTz = isValidTz(x.end_tz) ? x.end_tz : null;
  if (x.kind === 'flight') {
    if (!origin || !dest) problems.push('flight without origin or destination airport');
    if (!startTz && origin) startTz = tzForIata(origin);
    if (!endTz && dest) endTz = tzForIata(dest);
  }
  if (!endTz) endTz = startTz;
  if (!startTz) {
    problems.push('no resolvable timezone for start');
    return { leg: null, problems };
  }
  const startsAt = localToUtc(x.starts_at_local, startTz);
  if (!startsAt) {
    problems.push(`unparseable start time "${x.starts_at_local}"`);
    return { leg: null, problems };
  }
  const endsAt = x.ends_at_local && endTz ? localToUtc(x.ends_at_local, endTz) : null;

  return {
    problems,
    leg: {
      leg_key: legKey(x),
      kind: x.kind,
      status: x.status,
      confirmation_code: x.confirmation_code ? x.confirmation_code.trim().toUpperCase() : null,
      provider: x.provider,
      number: x.kind === 'hotel' ? x.hotel_name ?? x.number : x.kind === 'flight' ? normalizeFlightNumber(x.number) : x.number,
      origin_iata: origin,
      destination_iata: dest,
      starts_at: startsAt,
      start_tz: startTz,
      ends_at: endsAt,
      end_tz: endsAt ? endTz : null,
      hotel_name: x.hotel_name,
      address: x.address,
      city: x.city ?? x.destination_city,
      country: x.country,
      confidence: x.confidence,
    },
  };
}

// ---------- conflict detection ----------

export interface ComparableLeg {
  leg_key: string;
  kind: LegKind;
  status: LegStatus;
  starts_at: string;
  start_tz: string;
  ends_at: string | null;
  end_tz: string | null;
  origin_iata: string | null;
  destination_iata: string | null;
  hotel_name: string | null;
}

const RETURN_WINDOW_DAYS = 45;

function hotelNights(l: ComparableLeg): [string, string] {
  const checkIn = utcToLocalDate(l.starts_at, l.start_tz);
  const checkOut = l.ends_at ? utcToLocalDate(l.ends_at, l.end_tz ?? l.start_tz) : checkIn;
  return [checkIn, checkOut];
}

// Returns human-readable reasons; empty means safe to write directly.
export function detectConflicts(
  candidate: ComparableLeg,
  existing: ComparableLeg[],
  opts: { home: string; isKnownAirport: (iata: string) => boolean }
): string[] {
  const reasons: string[] = [];
  const others = existing.filter((e) => e.leg_key !== candidate.leg_key && e.status !== 'cancelled');
  if (candidate.status === 'cancelled') return reasons;

  if (candidate.kind === 'flight') {
    for (const code of [candidate.origin_iata, candidate.destination_iata]) {
      if (code && !opts.isKnownAirport(code)) reasons.push(`unknown airport ${code}`);
    }
  }

  if (candidate.kind === 'hotel') {
    const [inA, outA] = hotelNights(candidate);
    const nameA = normalizeHotelName(candidate.hotel_name);
    for (const o of others) {
      if (o.kind !== 'hotel') continue;
      if (normalizeHotelName(o.hotel_name) === nameA) continue;
      const [inB, outB] = hotelNights(o);
      if (inA < outB && inB < outA) {
        reasons.push(`overlapping hotel nights with ${o.hotel_name ?? 'another hotel'} (${inB} to ${outB})`);
      }
    }
  }

  if (candidate.kind === 'flight' && candidate.destination_iata === opts.home) {
    const t = Date.parse(candidate.starts_at);
    const windowMs = RETURN_WINDOW_DAYS * 86400000;
    const flights = others.filter((o) => o.kind === 'flight');
    for (const o of flights) {
      if (o.destination_iata !== opts.home) continue;
      const u = Date.parse(o.starts_at);
      if (Math.abs(u - t) > windowMs) continue;
      const [lo, hi] = t < u ? [t, u] : [u, t];
      const departedBetween = flights.some((f) => {
        const s = Date.parse(f.starts_at);
        return f.origin_iata === opts.home && s > lo && s < hi;
      });
      if (!departedBetween) {
        reasons.push(`second return flight home on the same trip (other leg ${o.leg_key})`);
      }
    }
  }

  return reasons;
}
