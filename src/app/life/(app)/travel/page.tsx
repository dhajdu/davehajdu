import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { Itinerary } from '@/components/life/travel/Itinerary';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { Postcard } from '@/components/life/travel/Postcard';
import { LEG_SELECT, TRIP_SELECT } from '@/components/life/travel/data';
import { passPropsFor } from '@/components/life/travel/pass';
import { daysBetween, todayKey } from '@/components/life/travel/format';
import type { Leg, Trip } from '@/components/life/travel/types';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

export default async function TravelUpcomingPage() {
  const { supabase } = await requireOwner();
  const today = todayKey();

  const upcoming = `end_on.gte.${today},and(end_on.is.null,start_on.gte.${today})`;
  // The trips and the legs of every upcoming trip in one round trip; the pass only shows the next trip's.
  const [tripsRes, legsRes] = await Promise.all([
    supabase.from('trips').select(TRIP_SELECT).or(upcoming).order('start_on'),
    supabase.from('trip_legs').select(`${LEG_SELECT}, trips!inner(start_on, end_on)`).or(upcoming, { referencedTable: 'trips' }).order('starts_at'),
  ]);
  if (tripsRes.error) throw new Error(tripsRes.error.message);
  const trips = (tripsRes.data ?? []) as unknown as Trip[];
  const [next, ...later] = trips;

  const legs = next ? ((legsRes.data ?? []) as unknown as Leg[]).filter((l) => l.trip_id === next.id && l.status !== 'cancelled') : [];

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
