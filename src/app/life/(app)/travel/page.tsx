import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, PageHeader } from '@/components/life/ui';
import { TravelTabs } from '@/components/life/travel/TravelTabs';
import { Itinerary } from '@/components/life/travel/Itinerary';
import { TripRow } from '@/components/life/travel/TripRow';
import { legsForTrips, TRIP_SELECT } from '@/components/life/travel/data';
import {
  countdown,
  fmtRange,
  nightsLabel,
  nightsOf,
  purposeLabel,
  purposeTone,
  todayKey,
} from '@/components/life/travel/format';
import type { Trip } from '@/components/life/travel/types';

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
  const where = next?.primary && [next.primary.city ?? next.primary.name, next.primary.country].filter(Boolean).join(', ');
  const when = next ? countdown(next, today) : '';

  return (
    <div className="max-w-2xl">
      <PageHeader title="Travel" />
      <TravelTabs active="upcoming" />

      {!next ? (
        <EmptyState>Trips arrive from Gmail and TripIt. Nothing upcoming yet.</EmptyState>
      ) : (
        <div className="space-y-5">
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted">{when === 'Now' ? 'On the road' : 'Next trip'}</p>
                <Link href={`/life/travel/${next.id}`} className="block text-xl font-bold text-navy break-words">
                  {next.title}
                </Link>
                {where && where !== next.title && <p className="text-sm text-body-text">{where}</p>}
                <p className="text-sm text-muted mt-0.5">
                  {fmtRange(next.start_on, next.end_on)}
                  {next.end_on && ` · ${nightsLabel(nightsOf(next))}`}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Chip tone={when === 'Now' ? 'magenta' : 'mint'}>{when}</Chip>
                <Chip tone={purposeTone[next.purpose]}>{purposeLabel[next.purpose]}</Chip>
              </div>
            </div>
          </Card>

          {legs.length > 0 ? (
            <Itinerary legs={legs} />
          ) : (
            <EmptyState>No bookings attached to this trip yet. Flights and hotels appear as their emails arrive.</EmptyState>
          )}

          {later.length > 0 && (
            <Card title="Later">
              <ul className="divide-y divide-border -my-3">
                {later.map((t) => (
                  <TripRow key={t.id} trip={t} right={<span className="text-xs text-muted">{countdown(t, today)}</span>} />
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
