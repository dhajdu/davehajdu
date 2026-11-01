import 'server-only';
import type { Leg, Trip } from './types';

type Client = Awaited<ReturnType<typeof import('@/lib/life/supabase-server').createLifeClient>>;

const PLACE = 'id, name, city, country, lat, lng, kind, iata';

export const TRIP_SELECT =
  'id, title, title_locked, start_on, end_on, purpose, notes, primary_place_id, primary:places!trips_primary_place_id_fkey(name, city, country)';

export const LEG_SELECT = `id, trip_id, kind, status, confirmation_code, provider, number, starts_at, start_tz, ends_at, end_tz, address,
  origin:places!trip_legs_origin_place_id_fkey(${PLACE}),
  destination:places!trip_legs_destination_place_id_fkey(${PLACE}),
  source:source_items(id, external_id, received_at, subject:payload->>subject, from:payload->>from, sources(slug))`;

type Page = PromiseLike<{ data: unknown[] | null; error: { message: string } | null }>;

// PostgREST caps responses (1000 rows by default), so page through everything.
export async function fetchAll<T>(build: (from: number, to: number) => Page): Promise<T[]> {
  const size = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await build(from, from + size - 1);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < size) return out;
  }
}

export async function legsForTrips(supabase: Client, tripIds: string[]): Promise<Leg[]> {
  if (tripIds.length === 0) return [];
  return fetchAll<Leg>((from, to) =>
    supabase.from('trip_legs').select(LEG_SELECT).in('trip_id', tripIds).order('starts_at').range(from, to)
  );
}

export async function allTrips(supabase: Client): Promise<Trip[]> {
  return fetchAll<Trip>((from, to) =>
    supabase.from('trips').select(TRIP_SELECT).order('start_on', { ascending: false }).range(from, to)
  );
}
