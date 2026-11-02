import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { Itinerary } from '@/components/life/travel/Itinerary';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { Postcard } from '@/components/life/travel/Postcard';
import { legsForTrips, TRIP_SELECT } from '@/components/life/travel/data';
import {
  HOME_IATA,
  HOME_TZ,
  daysBetween,
  fmtDay,
  fmtDuration,
  localDateKey,
  localTime,
  nightsOf,
  placeCode,
  purposeLabel,
  todayKey,
} from '@/components/life/travel/format';
import type { Place, Trip } from '@/components/life/travel/types';

export const metadata: Metadata = { title: 'Travel', robots: { index: false, follow: false } };

const cityOf = (p: Place | null | undefined) => p?.city ?? p?.name ?? '';

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
  const flight = legs.find((l) => l.kind === 'flight');
  const hotel = legs.find((l) => l.kind === 'hotel');
  const dest = next?.primary?.city ?? next?.primary?.name ?? next?.title ?? '';
  const started = !!next && next.start_on <= today;

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" />
      <TravelTabs active="upcoming" />

      {!next ? (
        <EmptyState>Trips arrive from Gmail and TripIt. Nothing upcoming yet.</EmptyState>
      ) : (
        <div className="space-y-8">
          <NextTripPass
            href={`/life/travel/${next.id}`}
            title={next.title}
            purpose={purposeLabel[next.purpose]}
            from={flight ? { code: placeCode(flight.origin), city: cityOf(flight.origin) } : { code: HOME_IATA, city: 'Home' }}
            to={flight ? { code: placeCode(flight.destination), city: cityOf(flight.destination) } : { code: hotel?.destination?.iata ?? dest, city: dest }}
            // Without a flight, count down to midnight home time (Vietnam has no DST).
            targetMs={flight ? Date.parse(flight.starts_at) : Date.parse(`${next.start_on}T00:00:00+07:00`)}
            departDay={fmtDay(flight ? localDateKey(flight.starts_at, flight.start_tz) : next.start_on)}
            departTime={flight ? `${localTime(flight.starts_at, flight.start_tz)} ${placeCode(flight.origin)}` : null}
            flight={flight ? ([flight.number, flight.provider].find(Boolean) ?? 'Flight') : null}
            duration={flight?.ends_at ? fmtDuration(flight.starts_at, flight.ends_at) : null}
            nights={next.end_on ? nightsOf(next) : null}
            hotel={hotel ? (hotel.destination?.name ?? hotel.provider) : null}
            destTz={flight?.end_tz ?? hotel?.start_tz ?? null}
            homeTz={HOME_TZ}
            code={flight?.confirmation_code ?? hotel?.confirmation_code ?? null}
            onRoad={
              started
                ? { day: daysBetween(next.start_on, today) + 1, of: daysBetween(next.start_on, next.end_on ?? today) + 1 }
                : null
            }
          />

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
