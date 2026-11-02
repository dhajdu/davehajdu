import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { TripRow } from '@/components/life/travel/TripRow';
import { AwayStrip, EarthLaps, Stamps, type AwayYear, type Stamp } from '@/components/life/travel/Passport';
import { allTrips, fetchAll } from '@/components/life/travel/data';
import { km } from '@/components/life/travel/geo';
import { isHome, localDateKey, nightsOf, todayKey } from '@/components/life/travel/format';
import type { Trip } from '@/components/life/travel/types';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

type LegPlace = { country: string | null; iata: string | null; kind: string; lat: number | null; lng: number | null };
type LegStat = {
  trip_id: string | null;
  kind: string;
  starts_at: string;
  start_tz: string;
  origin: LegPlace | null;
  destination: LegPlace | null;
};

const LEG_PLACE = 'country, iata, kind, lat, lng';

export default async function TravelPastPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();
  const now = new Date().toISOString();

  const [trips, legs] = await Promise.all([
    allTrips(supabase),
    fetchAll<LegStat>((from, to) =>
      supabase
        .from('trip_legs')
        .select(
          `trip_id, kind, starts_at, start_tz, origin:places!trip_legs_origin_place_id_fkey(${LEG_PLACE}), destination:places!trip_legs_destination_place_id_fkey(${LEG_PLACE})`
        )
        .neq('status', 'cancelled')
        .lte('starts_at', now)
        .range(from, to)
    ),
  ]);

  const started = trips.filter((t) => t.start_on <= today);
  const past = trips.filter((t) => (t.end_on ?? t.start_on) < today);
  const countries = new Set(
    legs
      .map((l) => l.destination)
      .filter((d): d is NonNullable<LegStat['destination']> => !!d && !!d.country && !isHome(d))
      .map((d) => d.country!.trim().toLowerCase())
  );
  const stats = [
    { label: 'Countries', value: countries.size },
    { label: 'Trips', value: started.length },
    { label: 'Flights', value: legs.filter((l) => l.kind === 'flight').length },
    { label: 'Nights away', value: started.reduce((n, t) => n + nightsOf(t, today), 0) },
  ];

  const byYear = new Map<string, Trip[]>();
  for (const t of past) {
    const y = t.start_on.slice(0, 4);
    byYear.set(y, [...(byYear.get(y) ?? []), t]);
  }

  // Passport: first landing per country, distance flown, weekly nights away.
  const stampMap = new Map<string, Stamp & { trips: Set<string> }>();
  legs.forEach((l, i) => {
    const d = l.destination;
    if (!d?.country || isHome(d)) return;
    const key = d.country.trim().toLowerCase();
    const day = localDateKey(l.starts_at, l.start_tz);
    const s = stampMap.get(key) ?? { country: d.country.trim(), code: d.iata, first: day, visits: 0, trips: new Set<string>() };
    if (day < s.first) Object.assign(s, { first: day, code: d.iata ?? s.code });
    s.trips.add(l.trip_id ?? `leg${i}`);
    s.visits = s.trips.size;
    stampMap.set(key, s);
  });
  const stamps = [...stampMap.values()].sort((a, b) => a.first.localeCompare(b.first));

  const flights = legs.filter((l) => l.kind === 'flight');
  const flownKm = flights.reduce((n, l) => {
    const a = l.origin;
    const b = l.destination;
    return a?.lat != null && a.lng != null && b?.lat != null && b.lng != null ? n + km({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }) : n;
  }, 0);
  const firstFlight = flights.reduce<string | null>((m, l) => (!m || l.starts_at < m ? l.starts_at : m), null);
  const since = firstFlight && new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(firstFlight));

  const awayYears: AwayYear[] = [...new Set(started.map((t) => t.start_on.slice(0, 4)))].sort().reverse().map((year) => ({
    year,
    weeks: Array.from({ length: 53 }, (_, w) => {
      let away = 0;
      let business = 0;
      let current = false;
      for (let d = 0; d < 7; d++) {
        const day = new Date(Date.UTC(Number(year), 0, 1 + w * 7 + d)).toISOString().slice(0, 10);
        if (!day.startsWith(year)) continue;
        if (day === today) current = true;
        const t = started.find((t) => day >= t.start_on && day < (t.end_on ?? t.start_on) && day < today);
        if (t) {
          away++;
          if (t.purpose === 'business') business++;
        }
      }
      return { away, business, current };
    }),
  }));

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" />
      <TravelTabs active="past" />

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="life-stat">
            <dt className="life-stat-k">{s.label}</dt>
            <dd className="life-stat-v text-2xl">{s.value.toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>

      {(flownKm > 0 || stamps.length > 0) && (
        <div className="space-y-4 mb-6">
          {flownKm > 0 && <EarthLaps km={flownKm} since={since} />}
          {stamps.length > 0 && <Stamps stamps={stamps} />}
          {awayYears.length > 0 && (
            <section className="life-card">
              <h2 className="life-card-title">Nights away by week</h2>
              <AwayStrip years={awayYears} />
            </section>
          )}
        </div>
      )}

      {past.length === 0 ? (
        <EmptyState>Trips arrive from Gmail and TripIt. No past trips yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {[...byYear.entries()].map(([year, list]) => (
            <Card key={year} title={`${year} · ${list.length} ${list.length === 1 ? 'trip' : 'trips'}`}>
              <ul className="divide-y divide-border -my-3">
                {list.map((t) => (
                  <TripRow key={t.id} trip={t} />
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
