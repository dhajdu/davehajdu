import Link from 'next/link';
import { Chip } from '@/components/life/ui';
import { fmtRange, nightsLabel, nightsOf, purposeLabel, purposeTone } from './format';
import type { Trip } from './types';

// One-line trip summary used in Later and Past lists.
export function TripRow({ trip, right }: { trip: Trip; right?: React.ReactNode }) {
  return (
    <li>
      <Link href={`/life/travel/${trip.id}`} className="flex items-center gap-3 py-3 min-h-12">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy truncate">{trip.title}</p>
          <p className="text-xs text-muted">
            {fmtRange(trip.start_on, trip.end_on)}
            {trip.end_on && ` · ${nightsLabel(nightsOf(trip))}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {right}
          <Chip tone={purposeTone[trip.purpose]}>{purposeLabel[trip.purpose]}</Chip>
        </div>
      </Link>
    </li>
  );
}
