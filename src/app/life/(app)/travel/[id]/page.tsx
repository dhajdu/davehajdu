import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, Chip, EmptyState, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { Itinerary } from '@/components/life/travel/Itinerary';
import { legsForTrips, TRIP_SELECT } from '@/components/life/travel/data';
import {
  countdown,
  fmtDay,
  fmtRange,
  nightsLabel,
  nightsOf,
  purposeLabel,
  purposeTone,
  todayKey,
} from '@/components/life/travel/format';
import type { Purpose, Trip } from '@/components/life/travel/types';
import { updateTripNotes, updateTripPurpose, updateTripTitle } from './actions';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Entry = { id: string; entry_date: string; title: string | null; kind: string; body_md: string };

function excerpt(md: string, n = 220): string {
  const text = md.replace(/[#>*_`\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return text.length > n ? `${text.slice(0, n).trimEnd()}…` : text;
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { supabase } = await requireOwner();

  const { data: tripRow, error } = await supabase.from('trips').select(TRIP_SELECT).eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!tripRow) notFound();
  const trip = tripRow as unknown as Trip;
  const lastDay = trip.end_on ?? trip.start_on;

  const [legs, linkRes, rangeRes] = await Promise.all([
    legsForTrips(supabase, [trip.id]),
    supabase.from('links').select('to_id').eq('from_type', 'trips').eq('from_id', trip.id).eq('relation', 'during').eq('to_type', 'entries'),
    supabase
      .from('entries')
      .select('id, entry_date, title, kind, body_md')
      .gte('entry_date', trip.start_on)
      .lte('entry_date', lastDay)
      .neq('kind', 'reference')
      .order('entry_date'),
  ]);
  if (linkRes.error) throw new Error(linkRes.error.message);
  if (rangeRes.error) throw new Error(rangeRes.error.message);

  const entries = new Map<string, Entry>(((rangeRes.data ?? []) as Entry[]).map((e) => [e.id, e]));
  const linkedIds = (linkRes.data ?? []).map((l: { to_id: string }) => l.to_id).filter((x) => !entries.has(x));
  if (linkedIds.length > 0) {
    const { data, error: e } = await supabase.from('entries').select('id, entry_date, title, kind, body_md').in('id', linkedIds);
    if (e) throw new Error(e.message);
    for (const row of (data ?? []) as Entry[]) entries.set(row.id, row);
  }
  const written = [...entries.values()].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  const active = legs.filter((l) => l.status !== 'cancelled');
  const cancelled = legs.filter((l) => l.status === 'cancelled');
  const today = todayKey();
  const status = lastDay < today ? null : countdown(trip, today);

  return (
    <div className="max-w-2xl space-y-5">
      <Link href="/life/travel" className="inline-block text-xs font-semibold text-blue">← Travel</Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-navy break-words">{trip.title}</h1>
        <p className="text-sm text-muted">
          {fmtRange(trip.start_on, trip.end_on)}
          {trip.end_on && ` · ${nightsLabel(nightsOf(trip))}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone={purposeTone[trip.purpose]}>{purposeLabel[trip.purpose]}</Chip>
          {status && <Chip tone={status === 'Now' ? 'magenta' : 'mint'}>{status}</Chip>}
          {trip.title_locked && <span className="text-xs text-muted">Title set by you</span>}
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer text-muted py-1">Edit title and purpose</summary>
          <div className="mt-2 space-y-3 border border-border rounded-xl p-3">
            <form action={updateTripTitle} className="flex gap-2">
              <input type="hidden" name="id" value={trip.id} />
              <label className="sr-only" htmlFor="trip-title">Title</label>
              <input
                id="trip-title"
                name="title"
                defaultValue={trip.title}
                required
                maxLength={200}
                className="min-w-0 flex-1 border border-border rounded-lg px-3 py-2 text-base text-navy"
              />
              <button type="submit" className={primaryButtonClass}>Save</button>
            </form>
            <p className="text-xs text-muted">Saving a title locks it, so the trip builder will not rename it.</p>
            <form action={updateTripPurpose} className="flex flex-wrap gap-2">
              <input type="hidden" name="id" value={trip.id} />
              {(['business', 'personal', 'unknown'] as Purpose[]).map((p) => (
                <button
                  key={p}
                  type="submit"
                  name="purpose"
                  value={p}
                  aria-pressed={trip.purpose === p}
                  className={trip.purpose === p ? primaryButtonClass : buttonClass}
                >
                  {purposeLabel[p]}
                </button>
              ))}
            </form>
          </div>
        </details>
      </header>

      <Card title="Itinerary">
        {active.length > 0 ? (
          <Itinerary legs={active} />
        ) : (
          <EmptyState>No bookings on this trip. Flights and hotels arrive from Gmail and TripIt.</EmptyState>
        )}
        {cancelled.length > 0 && (
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer text-muted py-1">Cancelled ({cancelled.length})</summary>
            <div className="mt-2">
              <Itinerary legs={cancelled} muted />
            </div>
          </details>
        )}
      </Card>

      <Card title="Written during this trip">
        {written.length > 0 ? (
          <ul className="divide-y divide-border -my-2">
            {written.map((e) => (
              <li key={e.id} className="py-3">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-muted">{fmtDay(e.entry_date, true)}</p>
                  {e.kind !== 'journal' && <Chip>{e.kind.replace('_', ' ')}</Chip>}
                </div>
                {e.title && <p className="font-semibold text-navy break-words">{e.title}</p>}
                {e.body_md && <p className="text-sm text-body-text mt-0.5 break-words">{excerpt(e.body_md)}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState>Journal entries from Notion dated inside this trip show up here. None yet.</EmptyState>
        )}
      </Card>

      <Card title="Notes">
        <form action={updateTripNotes} className="space-y-2">
          <input type="hidden" name="id" value={trip.id} />
          <label className="sr-only" htmlFor="trip-notes">Notes</label>
          <textarea
            id="trip-notes"
            name="notes"
            defaultValue={trip.notes ?? ''}
            rows={4}
            placeholder="Who you met, what happened, what to remember."
            className="w-full border border-border rounded-lg px-3 py-2 text-base text-body-text"
          />
          <button type="submit" className={primaryButtonClass}>Save notes</button>
        </form>
      </Card>
    </div>
  );
}
