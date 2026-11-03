import type { Metadata } from 'next';
import Link from 'next/link';
import { requireOwner } from '@/lib/life/auth';
import { PageHeader } from '@/components/life/ui';
import { GoalsTabs } from '@/components/life/goals/GoalsTabs';
import { GoalsHero, milestoneOf } from '@/components/life/goals/GoalsHero';
import { BoardColumn } from '@/components/life/goals/GoalList';
import { MonthGoals } from '@/components/life/focus/MonthGoals';
import { getFocus, getLongGoals } from '@/lib/life/focus';
import { METRIC_COLUMNS, addDays, currentPeriod, formatDate, getAreas, ictToday, periodLabel, weekStart, type MetricDef } from '@/lib/life/metrics';

export const metadata: Metadata = { title: 'Goals', robots: { index: false, follow: false } };

export default async function GoalsPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const year = today.slice(0, 4);
  const period = currentPeriod();
  const week = weekStart(today);

  const [focus, goals, areas, metricsRes] = await Promise.all([
    getFocus(supabase, today),
    getLongGoals(supabase, period, week),
    getAreas(supabase),
    supabase.from('metrics').select(METRIC_COLUMNS).order('name'),
  ]);
  const metrics = (metricsRes.data ?? []) as MetricDef[];
  const by = (h: string) => goals.filter((g) => g.horizon === h);
  const monthName = periodLabel(period, 'long').split(' ')[0];
  const journalMonth = focus.month && focus.month.month.trim().toLowerCase() === monthName.toLowerCase() ? focus.month : null;
  const short = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
  const todayThings = [focus.oneThing?.date === today ? focus.oneThing.health : null, focus.oneThing?.date === today ? focus.oneThing.business : null].filter(Boolean).length;

  const milestones = [
    { key: 'today', label: 'Today', when: short(today), total: 2, onTrack: todayThings, hit: 0 },
    milestoneOf('week', 'This week', `${short(week)} to ${short(addDays(week, 6))}`, by('week')),
    milestoneOf('month', monthName, year, by('month')),
    milestoneOf('year', year, 'this year', by('year')),
    milestoneOf('vision', 'Five years', `by ${Number(year) + 5}`, by('vision')),
  ];
  // Today's milestone counts the One Things written, not goals on track.
  milestones[0] = { ...milestones[0], total: 2, onTrack: todayThings };

  return (
    <div className="max-w-6xl">
      <PageHeader title="Goals" subtitle="Keep them current here. The ladder on Today reads from this board." />
      <GoalsTabs active="goals" />

      <GoalsHero statement={focus.vision?.statement ?? null} milestones={milestones} />

      <div className="life-board">
        <BoardColumn num={2} title="This week" when={`${short(week)} to ${short(addDays(week, 6))}`} rows={by('week')} horizon="week" period={week} areas={areas} metrics={metrics} />
        <BoardColumn num={3} title={monthName} when={year} rows={by('month')} horizon="month" period={period} areas={areas} metrics={metrics} />
        <BoardColumn num={4} title={year} when="This year" rows={by('year')} horizon="year" areas={areas} metrics={metrics} />
        <BoardColumn num={5} title="Five years" when={`By ${Number(year) + 5}`} rows={by('vision')} horizon="vision" areas={areas} metrics={metrics} />
      </div>

      <p className="life-board-foot">
        Today&apos;s two One Things are set on <Link href="/life">Today</Link>, where the vision statement, the core values and the whole picture also live.
      </p>

      {journalMonth && (
        <details className="mt-6">
          <summary className="cursor-pointer text-xs font-semibold text-blue">From the journal · {journalMonth.month}</summary>
          <div className="mt-3">
            <MonthGoals month={journalMonth} today={today} doing={focus.doing} />
          </div>
        </details>
      )}
    </div>
  );
}
