import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader } from '@/components/life/ui';
import { FocusLadder } from '@/components/life/focus/FocusLadder';
import { MonthGoals } from '@/components/life/focus/MonthGoals';
import { StatusMark, goalStatus } from '@/components/life/focus/StatusMark';
import { Foundation } from '@/components/life/health/Foundation';
import { NextTripPass } from '@/components/life/travel/NextTripPass';
import { Postcard } from '@/components/life/travel/Postcard';
import { LEG_SELECT, TRIP_SELECT } from '@/components/life/travel/data';
import { passPropsFor } from '@/components/life/travel/pass';
import { daysBetween } from '@/components/life/travel/format';
import type { Leg, Trip } from '@/components/life/travel/types';
import { getFocus, getLongGoals } from '@/lib/life/focus';
import { getHealth, WEIGHT } from '@/lib/life/health';
import { getLabs } from '@/lib/life/labs';
import { currentPeriod, ictToday, periodLabel, weekStart } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Today', robots: { index: false, follow: false } };

export default async function TodayPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const now = currentPeriod();
  const week = weekStart(today);

  const [focus, goals, health, labs, draftRes, pendingRes, currentRes, currentLegsRes, upcomingRes] = await Promise.all([
    getFocus(supabase, today),
    getLongGoals(supabase, now, week),
    getHealth(supabase, today, 30),
    getLabs(supabase),
    supabase.from('reviews').select('period').eq('status', 'draft').lte('period', now).order('period', { ascending: false }).limit(1),
    supabase.from('review_queue').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('trips').select(TRIP_SELECT).lte('start_on', today).gte('end_on', today).order('start_on', { ascending: false }).limit(1),
    // Legs of whatever trip is underway, fetched alongside the trip rather than after it.
    supabase.from('trip_legs').select(`${LEG_SELECT}, trips!inner(start_on, end_on)`).lte('trips.start_on', today).gte('trips.end_on', today).order('starts_at'),
    supabase.from('trips').select(TRIP_SELECT).gt('start_on', today).order('start_on').limit(3),
  ]);

  // The trip underway, if any, as the boarding pass in its on-the-road state.
  const current = (currentRes.data?.[0] ?? null) as Trip | null;
  const currentLegs = current ? ((currentLegsRes.data ?? []) as unknown as Leg[]).filter((l) => l.trip_id === current.id) : [];

  const weightTarget = goals.find((g) => g.metric?.slug === WEIGHT && g.target_value !== null && g.status === 'open')?.target_value;
  const monthGoals = goals.filter((g) => g.horizon === 'month' && g.period === now);
  // The journal's ❸ block only speaks for the month it was written in.
  const journalMonth = focus.month && focus.month.date.slice(0, 7) === now ? focus.month : null;
  const monthName = periodLabel(now, 'long').split(' ')[0];
  const hba1c = labs.readings.find((r) => r.metric.slug === 'hba1c') ?? null;
  const hba1cTarget = goals.find((g) => g.metric?.slug === 'hba1c' && g.target_value !== null && g.status === 'open')?.target_value;
  const draft = draftRes.data?.[0]?.period as string | undefined;
  const pending = pendingRes.count ?? 0;
  const upcoming = (upcomingRes.data ?? []) as unknown as Trip[];
  const longDate = new Date(`${today}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const day = focus.latest?.day;

  return (
    <div className="max-w-5xl">
      <PageHeader eyebrow={longDate} title="Today" subtitle={day ? `Day ${day} of the routine` : undefined} />

      <div className="space-y-5">
        <FocusLadder focus={focus} goals={goals} today={today} week={week} />

        <Card title="The foundation">
          <Foundation
            health={health}
            today={today}
            weightTarget={weightTarget === undefined || weightTarget === null ? null : Number(weightTarget)}
            hba1c={hba1c}
            hba1cTarget={hba1cTarget === undefined || hba1cTarget === null ? null : Number(hba1cTarget)}
          />
        </Card>

        {current && (
          <section aria-label="On the road">
            <h2 className="life-card-title">On the road</h2>
            <NextTripPass {...passPropsFor(current, currentLegs, today)} />
          </section>
        )}

        <div className="grid lg:grid-cols-5 gap-4">
          <Card title={`${monthName} goals`} className="lg:col-span-3">
            {monthGoals.length > 0 && (
              <ul className="life-goals mb-4">
                {monthGoals.map((g) => (
                  <li key={g.id} className={`life-goal is-${goalStatus(g.status)}${g.focus ? ' is-now' : ''}`}>
                    <StatusMark status={goalStatus(g.status)} />
                    <span className="life-goal-text">
                      {g.focus && <span className="text-muted">The one thing · </span>}
                      {g.title}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {journalMonth && monthGoals.length > 0 ? (
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-blue">From the journal · {journalMonth.month}</summary>
                <div className="mt-3"><MonthGoals month={journalMonth} today={today} /></div>
              </details>
            ) : journalMonth ? (
              <MonthGoals month={journalMonth} today={today} />
            ) : monthGoals.length === 0 ? (
              <p className="text-sm text-muted">No goals for {monthName} yet. The one thing goes on the ladder above; the rest on the goals page.</p>
            ) : null}
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
