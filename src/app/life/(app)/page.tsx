import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { FocusLadder } from '@/components/life/focus/FocusLadder';
import { MonthGoals } from '@/components/life/focus/MonthGoals';
import { Foundation } from '@/components/life/health/Foundation';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { Postcard } from '@/components/life/travel/Postcard';
import { TRIP_SELECT, legsForTrips } from '@/components/life/travel/data';
import { passPropsFor } from '@/components/life/travel/pass';
import { daysBetween } from '@/components/life/travel/format';
import type { Trip } from '@/components/life/travel/types';
import { getFocus, getLongGoals } from '@/lib/life/focus';
import { getHealth, WEIGHT } from '@/lib/life/health';
import { currentPeriod, ictToday, periodLabel } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Today', robots: { index: false, follow: false } };

export default async function TodayPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const now = currentPeriod();

  const [focus, goals, health, draftRes, pendingRes, currentRes, upcomingRes] = await Promise.all([
    getFocus(supabase, today),
    getLongGoals(supabase),
    getHealth(supabase, today, 30),
    supabase.from('reviews').select('period').eq('status', 'draft').lte('period', now).order('period', { ascending: false }).limit(1),
    supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('trips').select(TRIP_SELECT).lte('start_on', today).gte('end_on', today).order('start_on', { ascending: false }).limit(1),
    supabase.from('trips').select(TRIP_SELECT).gt('start_on', today).order('start_on').limit(3),
  ]);

  // The trip underway, if any, as the boarding pass in its on-the-road state.
  const current = (currentRes.data?.[0] ?? null) as Trip | null;
  const currentLegs = current ? await legsForTrips(supabase, [current.id]) : [];

  const weightTarget = goals.find((g) => g.metric?.slug === WEIGHT && g.target_value !== null && g.status === 'open')?.target_value;
  const draft = draftRes.data?.[0]?.period as string | undefined;
  const pending = pendingRes.count ?? 0;
  const upcoming = (upcomingRes.data ?? []) as unknown as Trip[];
  const longDate = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const day = focus.latest?.day;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={longDate} title="Today" subtitle={day ? `Day ${day} of the routine` : undefined} />

      <div className="space-y-5">
        <FocusLadder focus={focus} goals={goals} today={today} />

        <Card title="The foundation">
          <Foundation health={health} today={today} weightTarget={weightTarget === undefined || weightTarget === null ? null : Number(weightTarget)} />
        </Card>

        {current && (
          <section aria-label="On the road">
            <h2 className="life-card-title">On the road</h2>
            <NextTripPass {...passPropsFor(current, currentLegs, today)} />
          </section>
        )}

        <div className="grid lg:grid-cols-5 gap-4">
          <Card title={focus.month ? `${focus.month.month} goals` : 'This month'} className="lg:col-span-3">
            <MonthGoals month={focus.month} today={today} />
            <Link href="/life/goals" className="inline-block text-xs font-semibold text-blue mt-4">All goals</Link>
          </Card>

          <div className="lg:col-span-2 space-y-4">
            <Card title="Needs attention">
              {!draft && pending === 0 ? (
                <p className="text-sm text-muted">Nothing waiting.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {draft && (
                    <li className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="text-body-text">Review for {periodLabel(draft, 'long').split(' ')[0]} is ready</span>
                      <Link href={`/life/review/${draft}`} className="text-xs font-semibold text-blue">Open</Link>
                    </li>
                  )}
                  {pending > 0 && (
                    <li className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="text-body-text">
                        {pending} {pending === 1 ? 'item' : 'items'} waiting in the inbox
                      </span>
                      <Link href="/life/inbox" className="text-xs font-semibold text-blue">Inbox</Link>
                    </li>
                  )}
                </ul>
              )}
            </Card>

            <section>
              <h2 className="life-card-title">Coming up</h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted">No upcoming trips.</p>
              ) : (
                <ul className="life-postcards">
                  {upcoming.map((t) => (
                    <Postcard key={t.id} trip={t} daysAway={daysBetween(today, t.start_on)} />
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
