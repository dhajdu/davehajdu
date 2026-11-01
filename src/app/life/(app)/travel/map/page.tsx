import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { WorldMap, type MapPin } from '@/components/life/travel/WorldMap';
import { fetchAll } from '@/components/life/travel/data';
import { isHome } from '@/components/life/travel/format';
import type { Place } from '@/components/life/travel/types';

type Ref = { trip_id: string | null; origin_place_id: string | null; destination_place_id: string | null };

export default async function TravelMapPage() {
  const { supabase } = await requireOwner();

  const [places, legs, trips] = await Promise.all([
    fetchAll<Place>((from, to) =>
      supabase.from('places').select('id, name, city, country, lat, lng, kind, iata').range(from, to)
    ),
    fetchAll<Ref>((from, to) =>
      supabase
        .from('trip_legs')
        .select('trip_id, origin_place_id, destination_place_id')
        .neq('status', 'cancelled')
        .range(from, to)
    ),
    fetchAll<{ id: string; primary_place_id: string | null }>((from, to) =>
      supabase.from('trips').select('id, primary_place_id').range(from, to)
    ),
  ]);

  // Visits = distinct trips that touched the place (legs without a trip count once each).
  const visits = new Map<string, Set<string>>();
  const touch = (placeId: string | null, key: string) => {
    if (!placeId) return;
    if (!visits.has(placeId)) visits.set(placeId, new Set());
    visits.get(placeId)!.add(key);
  };
  legs.forEach((l, i) => {
    const key = l.trip_id ?? `leg${i}`;
    touch(l.origin_place_id, key);
    touch(l.destination_place_id, key);
  });
  trips.forEach((t) => touch(t.primary_place_id, t.id));

  const visited = places
    .filter((p) => visits.has(p.id))
    .map((p) => ({ place: p, count: visits.get(p.id)!.size }))
    .sort((a, b) => b.count - a.count || a.place.name.localeCompare(b.place.name));
  const located = visited.filter((v) => v.place.lat != null && v.place.lng != null);
  const pins: MapPin[] = located.map(({ place, count }) => ({
    id: place.id,
    label: place.iata ? `${place.name} (${place.iata})` : place.name,
    lat: place.lat!,
    lng: place.lng!,
    count,
    home: isHome(place),
  }));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Travel" />
      <TravelTabs active="map" />

      {visited.length === 0 ? (
        <EmptyState>Places come from the airports and hotels on your bookings, which arrive from Gmail and TripIt. None yet.</EmptyState>
      ) : (
        <div className="space-y-5">
          {pins.length > 0 ? (
            <div>
              <WorldMap pins={pins} />
              <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-2">
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-magenta" />Home</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue" />Visited, larger means more trips</span>
                {pins.length < visited.length && <span>{visited.length - pins.length} without coordinates</span>}
              </p>
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
