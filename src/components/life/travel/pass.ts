import type { PassProps } from './NextTripPass';
import { HOME_IATA, HOME_TZ, daysBetween, fmtDay, fmtDuration, localDateKey, localTime, nightsOf, placeCode, purposeLabel } from './format';
import type { Leg, Place, Trip } from './types';

const cityOf = (p: Place | null | undefined) => p?.city ?? p?.name ?? '';

// Everything the boarding pass needs for a trip, from its non-cancelled legs.
// Shared by the Travel page (next trip) and Today (the trip underway).
export function passPropsFor(trip: Trip, legs: Leg[], today: string): PassProps {
  const active = legs.filter((l) => l.status !== 'cancelled');
  const flight = active.find((l) => l.kind === 'flight');
  const hotel = active.find((l) => l.kind === 'hotel');
  const dest = trip.primary?.city ?? trip.primary?.name ?? trip.title;
  const started = trip.start_on <= today;
  return {
    href: `/life/travel/${trip.id}`,
    title: trip.title,
    purpose: purposeLabel[trip.purpose],
    from: flight ? { code: placeCode(flight.origin), city: cityOf(flight.origin) } : { code: HOME_IATA, city: 'Home' },
    to: flight ? { code: placeCode(flight.destination), city: cityOf(flight.destination) } : { code: hotel?.destination?.iata ?? dest, city: dest },
    // Without a flight, count down to midnight home time (Vietnam has no DST).
    targetMs: flight ? Date.parse(flight.starts_at) : Date.parse(`${trip.start_on}T00:00:00+07:00`),
    departDay: fmtDay(flight ? localDateKey(flight.starts_at, flight.start_tz) : trip.start_on),
    departTime: flight ? `${localTime(flight.starts_at, flight.start_tz)} ${placeCode(flight.origin)}` : null,
    flight: flight ? ([flight.number, flight.provider].find(Boolean) ?? 'Flight') : null,
    duration: flight?.ends_at ? fmtDuration(flight.starts_at, flight.ends_at) : null,
    nights: trip.end_on ? nightsOf(trip) : null,
    hotel: hotel ? (hotel.destination?.name ?? hotel.provider) : null,
    destTz: flight?.end_tz ?? hotel?.start_tz ?? null,
    homeTz: HOME_TZ,
    code: flight?.confirmation_code ?? hotel?.confirmation_code ?? null,
    onRoad: started ? { day: daysBetween(trip.start_on, today) + 1, of: daysBetween(trip.start_on, trip.end_on ?? today) + 1 } : null,
  };
}
