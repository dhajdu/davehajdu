// Date and time helpers for travel views. Leg times are always shown in the
// leg's own IANA timezone, never converted to the viewer's.
import type { Place, Purpose, Trip } from './types';

export const HOME_TZ = 'Asia/Ho_Chi_Minh';
export const HOME_IATA = 'SGN';

export function safeTz(tz: string | null | undefined): string {
  if (!tz) return 'UTC';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'UTC';
  }
}

// YYYY-MM-DD of an instant as seen in `tz`.
export function localDateKey(iso: string, tz: string | null | undefined): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTz(tz),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// HH:mm (24h) of an instant as seen in `tz`.
export function localTime(iso: string, tz: string | null | undefined): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: safeTz(tz),
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
}

export function todayKey(): string {
  return localDateKey(new Date().toISOString(), HOME_TZ);
}

function keyToUtc(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round((keyToUtc(toKey) - keyToUtc(fromKey)) / 86_400_000);
}

// "Thu, Nov 19" (adds the year when asked).
export function fmtDay(key: string, withYear = false): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(new Date(keyToUtc(key)));
}

// "Thu Nov 19 to Mon Nov 23", with years when the trip is not this year.
export function fmtRange(start: string, end: string | null): string {
  const withYear = start.slice(0, 4) !== todayKey().slice(0, 4) || (!!end && end.slice(0, 4) !== start.slice(0, 4));
  const a = fmtDay(start, withYear).replace(',', '');
  if (!end || end === start) return a;
  return `${a} to ${fmtDay(end, withYear).replace(',', '')}`;
}

export function nightsOf(trip: Pick<Trip, 'start_on' | 'end_on'>, capAt?: string): number {
  if (!trip.end_on) return 0;
  const end = capAt && trip.end_on > capAt ? capAt : trip.end_on;
  return Math.max(0, daysBetween(trip.start_on, end));
}

// Underway today: started, and not yet past its last day (a trip with no end lasts one day).
export function isCurrent(trip: Pick<Trip, 'start_on' | 'end_on'>, today = todayKey()): boolean {
  return trip.start_on <= today && (trip.end_on ?? trip.start_on) >= today;
}

export function nightsLabel(n: number): string {
  return `${n} ${n === 1 ? 'night' : 'nights'}`;
}

export function countdown(trip: Pick<Trip, 'start_on'>, today = todayKey()): string {
  const d = daysBetween(today, trip.start_on);
  if (d <= 0) return 'Now';
  if (d === 1) return 'Tomorrow';
  return `in ${d} days`;
}

export function placeCode(p: Place | null): string {
  if (!p) return '?';
  return p.iata ?? p.city ?? p.name;
}

export function isHome(p: Pick<Place, 'iata' | 'kind'>): boolean {
  return p.kind === 'home' || p.iata === HOME_IATA;
}

export const purposeTone: Record<Purpose, 'navy' | 'magenta' | 'mint' | 'gray'> = {
  business: 'navy',
  eo: 'magenta',
  personal: 'mint',
  unknown: 'gray',
};

export const purposeLabel: Record<Purpose, string> = {
  business: 'Business',
  eo: 'EO',
  personal: 'Holiday',
  unknown: 'Unsorted',
};

// "5h 50m" between two instants.
export function fmtDuration(fromIso: string, toIso: string): string {
  const mins = Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 60_000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
}
