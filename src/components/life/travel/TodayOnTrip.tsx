import { EmptyState } from '@/components/life/ui';
import { Itinerary, itineraryDays } from './Itinerary';
import { flightOn, leaveByFor } from './pass';
import { daysBetween, fmtDay, localDateKey, placeCode } from './format';
import type { Leg, Trip } from './types';

// The day you are in on the trip underway: tonight's hotel, then today's
// bookings. Shared by the Current tab and the On the road card on Today.
export function TodayOnTrip({ trip, legs, today }: { trip: Trip; legs: Leg[]; today: string }) {
  const hasToday = itineraryDays(legs).includes(today);
  const flight = flightOn(legs, today);
  const leaveBy = flight ? { day: today, ms: leaveByFor(flight), code: placeCode(flight.origin) } : undefined;
  const home = trip.end_on && trip.end_on > today ? trip.end_on : null;

  // Tonight's hotel: checked in by today, checking out after it.
  const stay = legs.find(
    (l) =>
      l.kind === 'hotel' &&
      !!l.ends_at &&
      localDateKey(l.starts_at, l.start_tz) <= today &&
      localDateKey(l.ends_at, l.end_tz ?? l.start_tz) > today
  );
  const checkout = stay ? localDateKey(stay.ends_at!, stay.end_tz ?? stay.start_tz) : null;

  return (
    <>
      {stay && checkout && (
        <p className="text-sm text-body-text mb-3">
          Staying at <span className="font-semibold text-navy">{stay.destination?.name ?? stay.provider ?? 'Hotel'}</span>
          {' · '}check out {daysBetween(today, checkout) === 1 ? 'tomorrow' : fmtDay(checkout)}
          {stay.address && <span className="block text-xs text-muted mt-0.5">{stay.address}</span>}
        </p>
      )}
      {hasToday ? (
        <Itinerary legs={legs} days={(d) => d === today} leaveBy={leaveBy} />
      ) : (
        <EmptyState>Nothing booked today.{home && ` Home ${fmtDay(home)}.`}</EmptyState>
      )}
    </>
  );
}
