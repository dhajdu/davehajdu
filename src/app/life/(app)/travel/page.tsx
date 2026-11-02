import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { Itinerary } from '@/components/life/travel/Itinerary';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { Postcard } from '@/components/life/travel/Postcard';
import { legsForTrips, TRIP_SELECT } from '@/components/life/travel/data';
import { passPropsFor } from '@/components/life/travel/pass';
import { daysBetween, todayKey } from '@/components/life/travel/format';
import type { Trip } from '@/components/life/travel/types';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

export default async function TravelUpcomingPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .or(`end_on.gte.${today},and(end_on.is.null,start_on.gte.${today})`)
    .order('start_on');
  if (error) throw new Error(error.message);
  const trips = (data ?? []) as unknown as Trip[];
  const [next, ...later] = trips;

  const legs = next ? (await legsForTrips(supabase, [next.id])).filter((l) => l.status !== 'cancelled') : [];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" subtitle="Where you are, and where you are going next" />
      <TravelTabs active="upcoming" />

      {!next ? (
        <EmptyState>Trips arrive from Gmail and TripIt. Nothing upcoming yet.</EmptyState>
      ) : (
        <div className="space-y-8">
          <NextTripPass {...passPropsFor(next, legs, today)} />

          {legs.length > 0 ? (
            <Itinerary legs={legs} />
          ) : (
            <EmptyState>No bookings attached to this trip yet. Flights and hotels appear as their emails arrive.</EmptyState>
          )}

          {later.length > 0 && (
            <section>
              <h2 className="life-card-title">Later</h2>
              <ul className="life-postcards">
                {later.map((t) => (
                  <Postcard key={t.id} trip={t} daysAway={daysBetween(today, t.start_on)} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
