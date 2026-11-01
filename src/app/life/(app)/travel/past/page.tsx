import { requireOwner } from '@/lib/life/auth';
import { Card, EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { TripRow } from '@/components/life/travel/TripRow';
import { allTrips, fetchAll } from '@/components/life/travel/data';
import { isHome, nightsOf, todayKey } from '@/components/life/travel/format';
import type { Trip } from '@/components/life/travel/types';

type LegStat = {
  kind: string;
  starts_at: string;
  destination: { country: string | null; iata: string | null; kind: string } | null;
};

export default async function TravelPastPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();
  const now = new Date().toISOString();

  const [trips, legs] = await Promise.all([
    allTrips(supabase),
    fetchAll<LegStat>((from, to) =>
      supabase
        .from('trip_legs')
        .select('kind, starts_at, destination:places!trip_legs_destination_place_id_fkey(country, iata, kind)')
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

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" />
      <TravelTabs active="past" />

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="border border-border rounded-xl p-3 bg-white">
            <dt className="text-xs font-semibold text-muted">{s.label}</dt>
            <dd className="text-2xl font-bold text-navy tabular-nums">{s.value.toLocaleString('en-US')}</dd>
          </div>
        ))}
      </dl>

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
