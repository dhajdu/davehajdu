import { EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from './TravelTabs';
import { Itinerary } from './Itinerary';
import { NextTripPass } from './NextTripPass';
import { Postcard } from './Postcard';
import { passPropsFor } from './pass';
import { daysBetween } from './format';
import type { Leg, Trip } from './types';

// Trips that have not started: the next one as a boarding pass, the rest as postcards.
// Rendered by /life/travel when nothing is underway, and by /life/travel/upcoming always.
export function UpcomingView({ trips, legs, today, hasCurrent }: { trips: Trip[]; legs: Leg[]; today: string; hasCurrent: boolean }) {
  const [next, ...later] = trips;
  const nextLegs = next ? legs.filter((l) => l.trip_id === next.id) : [];

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" subtitle="Where you are going next" />
      <TravelTabs active="upcoming" hasCurrent={hasCurrent} />

      {!next ? (
        <EmptyState>Trips arrive from Gmail and TripIt. Nothing upcoming yet.</EmptyState>
      ) : (
        <div className="space-y-8">
          <NextTripPass {...passPropsFor(next, nextLegs, today)} />

          {nextLegs.length > 0 ? (
            <Itinerary legs={nextLegs} />
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
