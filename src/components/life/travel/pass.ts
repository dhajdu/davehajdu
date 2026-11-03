import type { PassProps } from './NextTripPass';
import { HOME_IATA, HOME_TZ, daysBetween, fmtDay, fmtDuration, localDateKey, localTime, nightsOf, placeCode, purposeLabel } from './format';
import type { Leg, Place, Trip } from './types';

const cityOf = (p: Place | null | undefined) => p?.city ?? p?.name ?? '';

// Hours to be at the airport ahead of departure: a domestic hop needs less.
function airportLead(flight: Leg): number {
  const a = flight.origin?.country?.trim().toLowerCase();
  const b = flight.destination?.country?.trim().toLowerCase();
  return a && b && a === b ? 2 : 3;
}

// Everything the boarding pass needs for a trip, from its non-cancelled legs.
// Shared by the Travel page (next or current trip) and Today (the trip underway).
// Before the trip it is the outbound flight. On the road it is today: today's
// flight if there is one (else the next, else the outbound), the hotel you
// check out of, and when to leave for the airport.
export function passPropsFor(trip: Trip, legs: Leg[], today: string): PassProps {
  const active = legs.filter((l) => l.status !== 'cancelled');
  const flights = active.filter((l) => l.kind === 'flight');
  const hotels = active.filter((l) => l.kind === 'hotel');
  const dayOf = (l: Leg) => localDateKey(l.starts_at, l.start_tz);
  const started = trip.start_on <= today;

  const flight = started ? (flights.find((l) => dayOf(l) === today) ?? flights.find((l) => dayOf(l) > today) ?? flights[0]) : flights[0];
  const hotel = hotels[0];
  const flightIsToday = !!flight && started && dayOf(flight) === today;
  const flightToday = flightIsToday && Date.parse(flight.starts_at) > Date.now();
  const leaving = started ? hotels.find((l) => l.ends_at && localDateKey(l.ends_at, l.end_tz ?? l.start_tz) === today) : undefined;
  const dest = trip.primary?.city ?? trip.primary?.name ?? trip.title;

  return {
    href: `/life/travel/${trip.id}`,
    title: trip.title,
    purpose: purposeLabel[trip.purpose],
    place: dest,
    from: flight ? { code: placeCode(flight.origin), city: cityOf(flight.origin) } : { code: HOME_IATA, city: 'Home' },
    to: flight ? { code: placeCode(flight.destination), city: cityOf(flight.destination) } : { code: hotel?.destination?.iata ?? dest, city: dest },
    // Without a flight, count down to midnight home time (Vietnam has no DST).
    targetMs: flight ? Date.parse(flight.starts_at) : Date.parse(`${trip.start_on}T00:00:00+07:00`),
    departDay: flightIsToday ? 'Today' : fmtDay(flight ? dayOf(flight) : trip.start_on),
    departTime: flight ? `${localTime(flight.starts_at, flight.start_tz)} ${placeCode(flight.origin)}` : null,
    flight: flight ? ([flight.number, flight.provider].find(Boolean) ?? 'Flight') : null,
    duration: flight?.ends_at ? fmtDuration(flight.starts_at, flight.ends_at) : null,
    nights: trip.end_on ? nightsOf(trip) : null,
    hotel: hotel ? (hotel.destination?.name ?? hotel.provider) : null,
    checkout: leaving
      ? { time: localTime(leaving.ends_at!, leaving.end_tz ?? leaving.start_tz), hotel: leaving.destination?.name ?? leaving.provider ?? 'Hotel' }
      : null,
    leaveBy:
      flightToday && flight
        ? {
            code: placeCode(flight.origin),
            time: localTime(new Date(Date.parse(flight.starts_at) - airportLead(flight) * 3_600_000).toISOString(), flight.start_tz),
            hours: airportLead(flight),
          }
        : null,
    destTz: flight?.end_tz ?? hotel?.start_tz ?? null,
    homeTz: HOME_TZ,
    // Today's leg may carry no code of its own; any code on the trip still gets you to the booking.
    code:
      flight?.confirmation_code ??
      flights.find((l) => l.confirmation_code)?.confirmation_code ??
      hotels.find((l) => l.confirmation_code)?.confirmation_code ??
      null,
    onRoad: started ? { day: daysBetween(trip.start_on, today) + 1, of: daysBetween(trip.start_on, trip.end_on ?? today) + 1 } : null,
    flightToday,
  };
}
