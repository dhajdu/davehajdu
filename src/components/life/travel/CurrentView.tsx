import { EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from './TravelTabs';
import { Itinerary, itineraryDays } from './Itinerary';
import { NextTripPass } from './NextTripPass';
import { TodayOnTrip } from './TodayOnTrip';
import { passPropsFor } from './pass';
import { fmtDay } from './format';
import type { Leg, Trip } from './types';

// The trip underway: today's bookings first, then what is left of the trip,
// with the days already behind you folded away.
export function CurrentView({ trip, legs, today }: { trip: Trip; legs: Leg[]; today: string }) {
  const days = itineraryDays(legs);
  const hasLater = days.some((d) => d > today);
  const hasEarlier = days.some((d) => d < today);
  const home = trip.end_on && trip.end_on > today ? trip.end_on : null;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" subtitle="Where you are today" />
      <TravelTabs active="current" hasCurrent />

      <div className="space-y-8">
        <NextTripPass {...passPropsFor(trip, legs, today)} />

        <section>
          <h2 className="life-card-title">Today</h2>
          <TodayOnTrip trip={trip} legs={legs} today={today} />
        </section>

        {(hasLater || home) && (
          <section>
            <h2 className="life-card-title">Rest of the trip</h2>
            {hasLater ? <Itinerary legs={legs} days={(d) => d > today} /> : <EmptyState>Nothing more booked. Home {fmtDay(home!)}.</EmptyState>}
          </section>
        )}

        {hasEarlier && (
          <details className="text-sm">
            <summary className="cursor-pointer text-muted py-1">Earlier on this trip</summary>
            <div className="mt-2 opacity-70">
              <Itinerary legs={legs} days={(d) => d < today} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
