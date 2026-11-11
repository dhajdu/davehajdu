import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { PageHeader } from '@/components/life/ui';
import { FocusLadder } from '@/components/life/focus/FocusLadder';
import { VisionSection } from '@/components/life/focus/VisionSection';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { TodayOnTrip } from '@/components/life/travel/TodayOnTrip';
import { LEG_SELECT, TRIP_SELECT } from '@/components/life/travel/data';
import { passPropsFor } from '@/components/life/travel/pass';
import type { Leg, Trip } from '@/components/life/travel/types';
import { getFocus, getLongGoals } from '@/lib/life/focus';
import { addDays, currentPeriod, ictToday, monthWeeks, weekStart } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'The One Thing', robots: { index: false, follow: false } };

export default async function TodayPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const now = currentPeriod();
  const week = weekStart(today);
  // Every week of the month the current week belongs to, so each can be set ahead and adjusted.
  const weeks = monthWeeks(addDays(week, 3).slice(0, 7));

  const [focus, goals, currentRes, currentLegsRes] = await Promise.all([
    getFocus(supabase, today),
    getLongGoals(supabase, now, weeks),
    supabase.from('trips').select(TRIP_SELECT).lte('start_on', today).gte('end_on', today).order('start_on', { ascending: false }).limit(1),
    // Legs of whatever trip is underway, fetched alongside the trip rather than after it.
    supabase.from('trip_legs').select(`${LEG_SELECT}, trips!inner(start_on, end_on)`).lte('trips.start_on', today).gte('trips.end_on', today).order('starts_at'),
  ]);

  // The trip underway, if any: the boarding pass in its on-the-road state, then today's bookings.
  const current = (currentRes.data?.[0] ?? null) as Trip | null;
  const currentLegs = current ? ((currentLegsRes.data ?? []) as unknown as Leg[]).filter((l) => l.trip_id === current.id && l.status !== 'cancelled') : [];

  const longDate = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const day = focus.latest?.day;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={longDate} title="The One Thing" subtitle={day ? `Day ${day} of the routine` : undefined} />

      <div className="space-y-5">
        <FocusLadder focus={focus} goals={goals} today={today} week={week} weeks={weeks} />
        {current && (
          <section aria-label="On the road">
            <h2 className="life-card-title">On the road</h2>
            <NextTripPass {...passPropsFor(current, currentLegs, today)} />
            <div className="mt-4 space-y-3">
              <TodayOnTrip trip={current} legs={currentLegs} today={today} />
              <Link href="/life/travel" className="inline-block text-xs font-semibold text-blue">Rest of the trip →</Link>
            </div>
          </section>
        )}
        <VisionSection vision={focus.vision} until={Number(today.slice(0, 4)) + 5} />
      </div>
    </div>
  );
}
