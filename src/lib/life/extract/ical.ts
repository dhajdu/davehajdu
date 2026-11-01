// TripIt iCal feed: parse VEVENTs and map flights and hotel stays to legs.
// Pure (type-only imports) so scripts/life/test-travel.ts can load it.
import type { ExtractedLeg } from './legs';

export interface IcalTime {
  // "YYYY-MM-DDTHH:MM:SS" (wall clock, or UTC when utc=true) or "YYYY-MM-DD" when allDay.
  value: string;
  tz: string | null;
  utc: boolean;
  allDay: boolean;
}

export interface IcalEvent {
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: IcalTime | null;
  end: IcalTime | null;
}

function unescapeText(v: string): string {
  return v.replace(/\\([\\;,nN])/g, (_, c: string) => (c === 'n' || c === 'N' ? '\n' : c));
}

// Split "NAME;P1=a;P2="x:y":VALUE" at the first colon outside quotes.
function splitLine(line: string): { name: string; params: Record<string, string>; value: string } | null {
  let inQuote = false;
  let idx = -1;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQuote = !inQuote;
    else if (ch === ':' && !inQuote) {
      idx = i;
      break;
    }
  }
  if (idx < 0) return null;
  const [name, ...rawParams] = line.slice(0, idx).split(';');
  const params: Record<string, string> = {};
  for (const p of rawParams) {
    const eq = p.indexOf('=');
    if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1).replace(/^"|"$/g, '');
  }
  return { name: name.toUpperCase(), params, value: line.slice(idx + 1) };
}

function parseTime(value: string, params: Record<string, string>): IcalTime | null {
  const v = value.trim();
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(v)) {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
    return m ? { value: `${m[1]}-${m[2]}-${m[3]}`, tz: null, utc: false, allDay: true } : null;
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})?(Z)?$/);
  if (!m) return null;
  return {
    value: `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6] ?? '00'}`,
    tz: m[7] ? 'UTC' : params.TZID ?? null,
    utc: !!m[7],
    allDay: false,
  };
}

export function parseIcal(text: string): IcalEvent[] {
  const unfolded = text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '');
  const events: IcalEvent[] = [];
  let cur: IcalEvent | null = null;
  for (const raw of unfolded.split('\n')) {
    const line = raw.trimEnd();
    if (line === 'BEGIN:VEVENT') {
      cur = { uid: '', summary: '', description: '', location: '', start: null, end: null };
      continue;
    }
    if (line === 'END:VEVENT') {
      if (cur) events.push(cur);
      cur = null;
      continue;
    }
    if (!cur) continue;
    const p = splitLine(line);
    if (!p) continue;
    switch (p.name) {
      case 'UID':
        cur.uid = p.value.trim();
        break;
      case 'SUMMARY':
        cur.summary = unescapeText(p.value).trim();
        break;
      case 'DESCRIPTION':
        cur.description = unescapeText(p.value);
        break;
      case 'LOCATION':
        cur.location = unescapeText(p.value).trim();
        break;
      case 'DTSTART':
        cur.start = parseTime(p.value, p.params);
        break;
      case 'DTEND':
        cur.end = parseTime(p.value, p.params);
        break;
    }
  }
  return events;
}

// Feeds repeat events; keep the first of each identical uid/start/end/summary.
export function dedupeEvents(events: IcalEvent[]): IcalEvent[] {
  const seen = new Set<string>();
  return events.filter((e) => {
    const k = [e.uid, e.start?.value, e.start?.tz, e.end?.value, e.summary].join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function utcToLocalDateTime(isoUtc: string, tz: string): string {
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const p: Record<string, string> = {};
  for (const part of dtf.formatToParts(new Date(`${isoUtc}Z`))) p[part.type] = part.value;
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Event time -> local wall clock + zone. fallbackTz is used for UTC or floating times.
function toLocal(t: IcalTime, fallbackTz: string | null): { local: string; tz: string | null } {
  if (t.allDay) return { local: `${t.value}T00:00`, tz: fallbackTz };
  if (t.utc) return fallbackTz ? { local: utcToLocalDateTime(t.value, fallbackTz), tz: fallbackTz } : { local: t.value.slice(0, 16), tz: 'UTC' };
  return { local: t.value.slice(0, 16), tz: t.tz ?? fallbackTz };
}

const FLIGHT_RE = /^([A-Z0-9]{2})\s?(\d{1,4})\s+([A-Z]{3})\s+to\s+([A-Z]{3})\b/i;
const CHECKIN_RE = /^check[\s-]?in:?\s+(.+)$/i;
const CHECKOUT_RE = /^check[\s-]?out:?\s+(.+)$/i;
const CONF_RE = /confirmation\s*(?:#|number|no\.?|code)?\s*:?\s*([A-Z0-9]{5,10})\b/i;

export interface AirportLookup {
  (iata: string): { tz: string; city: string; country: string } | null;
}

export interface MappedLeg {
  external_id: string;
  leg: ExtractedLeg;
}

const blank = (): Omit<ExtractedLeg, 'kind' | 'starts_at_local'> => ({
  status: 'confirmed',
  confirmation_code: null,
  provider: null,
  number: null,
  origin_iata: null,
  destination_iata: null,
  origin_city: null,
  destination_city: null,
  start_tz: null,
  ends_at_local: null,
  end_tz: null,
  hotel_name: null,
  address: null,
  city: null,
  country: null,
  confidence: 0.95,
});

const hotelKey = (name: string) => name.trim().toUpperCase().replace(/\s+/g, ' ');

// Maps deduped events to flight and hotel legs. Whole-trip summary events
// (all-day, not a check-in/out) and anything else are returned in `skipped`.
export function icalToLegs(events: IcalEvent[], airport: AirportLookup): { legs: MappedLeg[]; skipped: string[] } {
  const sorted = [...events].sort((a, b) => (a.start?.value ?? '').localeCompare(b.start?.value ?? ''));
  const legs: MappedLeg[] = [];
  const skipped: string[] = [];
  const checkouts: IcalEvent[] = [];
  const checkins: IcalEvent[] = [];
  const arrivalsBefore: { at: string; info: { tz: string; city: string; country: string } }[] = [];

  for (const e of sorted) {
    if (!e.start) {
      skipped.push(e.uid);
      continue;
    }
    const f = e.summary.match(FLIGHT_RE);
    if (f) {
      const origin = f[3].toUpperCase();
      const dest = f[4].toUpperCase();
      const o = airport(origin);
      const d = airport(dest);
      const s = toLocal(e.start, o?.tz ?? null);
      const en = e.end ? toLocal(e.end, d?.tz ?? null) : null;
      const conf = e.description.match(CONF_RE)?.[1]?.toUpperCase() ?? null;
      legs.push({
        external_id: e.uid,
        leg: {
          ...blank(),
          kind: 'flight',
          number: `${f[1].toUpperCase()}${f[2]}`,
          confirmation_code: conf,
          origin_iata: origin,
          destination_iata: dest,
          origin_city: o?.city ?? null,
          destination_city: d?.city ?? null,
          city: d?.city ?? null,
          country: d?.country ?? null,
          starts_at_local: s.local,
          start_tz: s.tz,
          ends_at_local: en?.local ?? null,
          end_tz: en?.tz ?? null,
          confidence: o && d ? 0.95 : 0.6,
        },
      });
      if (d) arrivalsBefore.push({ at: e.start.value, info: d });
      continue;
    }
    if (CHECKIN_RE.test(e.summary)) {
      checkins.push(e);
      continue;
    }
    if (CHECKOUT_RE.test(e.summary)) {
      checkouts.push(e);
      continue;
    }
    skipped.push(e.uid);
  }

  const usedOut = new Set<IcalEvent>();
  for (const ci of checkins) {
    const name = ci.summary.match(CHECKIN_RE)![1].trim();
    const co = checkouts.find(
      (c) => !usedOut.has(c) && hotelKey(c.summary.match(CHECKOUT_RE)![1]) === hotelKey(name) && (c.start!.value > ci.start!.value)
    );
    if (co) usedOut.add(co);
    // Hotel zone/city: the last flight arrival before check-in, when the feed gives UTC.
    const prior = [...arrivalsBefore].reverse().find((a) => a.at <= ci.start!.value)?.info ?? null;
    const tz = ci.start!.tz && !ci.start!.utc ? ci.start!.tz : prior?.tz ?? null;
    const s = toLocal(ci.start!, tz);
    const startLocal = ci.start!.allDay ? `${ci.start!.value}T15:00` : s.local;
    let endLocal: string | null = null;
    if (co) endLocal = co.start!.allDay ? `${co.start!.value}T11:00` : toLocal(co.start!, tz).local;
    legs.push({
      external_id: ci.uid,
      leg: {
        ...blank(),
        kind: 'hotel',
        hotel_name: name,
        number: name,
        confirmation_code: ci.description.match(CONF_RE)?.[1]?.toUpperCase() ?? null,
        address: ci.location || null,
        city: prior?.city ?? null,
        country: prior?.country ?? null,
        starts_at_local: startLocal,
        start_tz: s.tz,
        ends_at_local: endLocal,
        end_tz: endLocal ? s.tz : null,
        confidence: s.tz && prior ? 0.9 : 0.6,
      },
    });
  }
  for (const co of checkouts) if (!usedOut.has(co)) skipped.push(co.uid);

  return { legs, skipped };
}
