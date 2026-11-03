import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { WorldMap, type MapArc, type MapPin } from '@/components/life/travel/WorldMap';
import { fetchAll } from '@/components/life/travel/data';
import { isCurrent, isHome, todayKey } from '@/components/life/travel/format';
import type { Place } from '@/components/life/travel/types';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

type Ref = { trip_id: string | null; kind: string; starts_at: string; origin_place_id: string | null; destination_place_id: string | null };

export default async function TravelMapPage() {
  const { supabase } = await requireOwner();

  const [places, legs, trips] = await Promise.all([
    fetchAll<Place>((from, to) =>
      supabase.from('places').select('id, name, city, country, lat, lng, kind, iata').range(from, to)
    ),
    fetchAll<Ref>((from, to) =>
      supabase
        .from('trip_legs')
        .select('trip_id, kind, starts_at, origin_place_id, destination_place_id')
        .neq('status', 'cancelled')
        .range(from, to)
    ),
    fetchAll<{ id: string; primary_place_id: string | null; start_on: string; end_on: string | null; purpose: string }>((from, to) =>
      supabase.from('trips').select('id, primary_place_id, start_on, end_on, purpose').range(from, to)
    ),
  ]);

  // Visits = distinct trips that touched the place (legs without a trip count once each), per year.
  const visits = new Map<string, Map<string, Set<string>>>();
  const touch = (placeId: string | null, key: string, year: string) => {
    if (!placeId) return;
    const byYear = visits.get(placeId) ?? new Map<string, Set<string>>();
    visits.set(placeId, byYear);
    byYear.set(year, (byYear.get(year) ?? new Set()).add(key));
  };
  legs.forEach((l, i) => {
    const key = l.trip_id ?? `leg${i}`;
    touch(l.origin_place_id, key, l.starts_at.slice(0, 4));
    touch(l.destination_place_id, key, l.starts_at.slice(0, 4));
  });
  trips.forEach((t) => touch(t.primary_place_id, t.id, t.start_on.slice(0, 4)));
  const total = (id: string) => new Set([...visits.get(id)!.values()].flatMap((s) => [...s])).size;

  const visited = places
    .filter((p) => visits.has(p.id))
    .map((p) => ({ place: p, count: total(p.id) }))
    .sort((a, b) => b.count - a.count || a.place.name.localeCompare(b.place.name));
  const located = visited.filter((v) => v.place.lat != null && v.place.lng != null);
  const pins: MapPin[] = located.map(({ place }) => ({
    id: place.id,
    label: place.iata ? `${place.name} (${place.iata})` : place.name,
    code: place.iata ?? place.city ?? place.name,
    lat: place.lat!,
    lng: place.lng!,
    byYear: Object.fromEntries([...visits.get(place.id)!].map(([y, s]) => [y, s.size])),
    home: isHome(place),
  }));

  // One arc per route per year, from every leg that moves between two known points.
  const byId = new Map(places.map((p) => [p.id, p]));
  const business = new Set(trips.filter((t) => t.purpose === 'business').map((t) => t.id));
  const eo = new Set(trips.filter((t) => t.purpose === 'eo').map((t) => t.id));
  const arcMap = new Map<string, MapArc>();
  legs.forEach((l, i) => {
    const a = l.origin_place_id ? byId.get(l.origin_place_id) : undefined;
    const b = l.destination_place_id ? byId.get(l.destination_place_id) : undefined;
    if (!a || !b || a.id === b.id || a.lat == null || a.lng == null || b.lat == null || b.lng == null) return;
    const year = l.starts_at.slice(0, 4);
    const key = `${year}:${a.id}:${b.id}`;
    const arc = arcMap.get(key) ?? {
      key,
      from: { lat: a.lat, lng: a.lng },
      to: { lat: b.lat, lng: b.lng },
      year,
      business: !!l.trip_id && business.has(l.trip_id),
      eo: !!l.trip_id && eo.has(l.trip_id),
      count: 0,
      trips: [],
    };
    arc.count += 1;
    arc.trips.push(l.trip_id ?? `leg${i}`);
    arcMap.set(key, arc);
  });
  const arcs = [...arcMap.values()].sort((x, y) => x.key.localeCompare(y.key));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Travel" />
      <TravelTabs active="map" hasCurrent={trips.some((t) => isCurrent(t, todayKey()))} />

      {visited.length === 0 ? (
        <EmptyState>Places come from the airports and hotels on your bookings, which arrive from Gmail and TripIt. None yet.</EmptyState>
      ) : (
        <div className="space-y-5">
          {pins.length > 0 ? (
            <div>
              <WorldMap pins={pins} arcs={arcs} />
              {pins.length < visited.length && (
                <p className="text-xs text-muted mt-2">{visited.length - pins.length} places without coordinates are listed below but not pinned</p>
              )}
            </div>
          ) : (
            <EmptyState>{visited.length} places visited, but none has coordinates yet, so there is nothing to pin.</EmptyState>
          )}

          <Card title={`${visited.length} places`}>
            <ul className="divide-y divide-border -my-2">
              {visited.map(({ place, count }) => (
                <li key={place.id} className="flex items-center gap-3 py-2">
                  <span
                    aria-hidden
                    className={`w-2 h-2 rounded-full shrink-0 ${isHome(place) ? 'bg-magenta' : place.lat != null ? 'bg-blue' : 'bg-border'}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy truncate">
                      {place.name}
                      {place.iata && place.iata !== place.name && <span className="text-muted font-normal"> · {place.iata}</span>}
                    </p>
                    {(place.city || place.country) && (
                      <p className="text-xs text-muted truncate">{[place.city, place.country].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted tabular-nums shrink-0">
                    {count} {count === 1 ? 'trip' : 'trips'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
