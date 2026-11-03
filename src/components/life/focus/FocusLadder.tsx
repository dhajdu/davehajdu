import Link from 'next/link';
import type { Focus, GoalRow } from '@/lib/life/focus';
import { addDays, formatDate } from '@/lib/life/metrics';
import { SaveButton } from '@/components/life/SaveButton';
import { setOneThing } from '@/app/life/(app)/journal/[date]/actions';
import { setFocusGoal } from '@/app/life/(app)/goals/actions';
import { StatusMark, goalStatus } from './StatusMark';

// The question the app answers, as one ladder: today, this week, this month,
// this year, five years. A rung that is not filled in yet is empty and takes
// the answer right here. Today lives in the journal; the week and the month
// are goals; the year and the vision come from the goals page.
export function FocusLadder({ focus, goals, today, week }: { focus: Focus; goals: GoalRow[]; today: string; week: string }) {
  const year = today.slice(0, 4);
  const period = today.slice(0, 7);
  const short = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
  const monthName = new Date(`${period}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });

  // Only today's own One Thing counts as today's.
  const oneThing = focus.oneThing?.date === today ? focus.oneThing : null;

  // The journal's ❸ block only speaks for the month it was written in.
  const journalMonth = focus.month && focus.month.date.slice(0, 7) === period ? focus.month : null;
  const dayOfMonth = Number(today.slice(8, 10));
  const weekNo = Math.min(5, Math.ceil(dayOfMonth / 7));
  const journalWeek = journalMonth?.weeks.find((w) => w.week === weekNo) ?? null;

  const appWeek = goals.filter((g) => g.horizon === 'week' && g.period === week);
  const appMonth = goals.filter((g) => g.horizon === 'month' && g.period === period);
  const monthGoals = journalMonth ? (journalMonth.goals.length ? journalMonth.goals : journalMonth.moves) : [];
  const yearGoals = goals.filter((g) => g.horizon === 'year');
  const vision = goals.filter((g) => g.horizon === 'vision');

  return (
    <section className="life-ladder" aria-label="The one thing">
      <div className="life-ladder-head">
        <span className="life-ladder-title">The one thing</span>
        <span className="life-ladder-q">Am I living the life I intend to live?</span>
      </div>
      <div className="life-rungs">
        <div className="life-rung is-now">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            Today
            <small>{short(today)}</small>
          </span>
          <div className="life-rung-body">
            {oneThing ? (
              <p className="life-rung-text">{oneThing.text}</p>
            ) : (
              <form action={setOneThing} className="life-rung-form">
                <input type="hidden" name="date" value={today} />
                <input name="one_thing" required maxLength={300} placeholder="What is the one thing today?" aria-label="The one thing today" autoComplete="off" />
                <SaveButton>Set</SaveButton>
              </form>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            This week
            <small>{short(week)} to {short(addDays(week, 6))}</small>
          </span>
          <div className="life-rung-body">
            {appWeek.length ? (
              appWeek.map((g) => (
                <p key={g.id} className={`life-rung-item is-${goalStatus(g.status)}${g.focus ? ' is-focus' : ''}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <span>{g.title}</span>
                </p>
              ))
            ) : journalWeek ? (
              <p className={`life-rung-item is-${journalWeek.status}`}>
                <StatusMark status={journalWeek.status} />
                <span>{journalWeek.text}</span>
              </p>
            ) : (
              <form action={setFocusGoal} className="life-rung-form">
                <input type="hidden" name="horizon" value="week" />
                <input type="hidden" name="period" value={week} />
                <input name="title" required maxLength={200} placeholder="What is the one thing this week?" aria-label="The one thing this week" autoComplete="off" />
                <SaveButton>Set</SaveButton>
              </form>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            {monthName}
            <small>this month</small>
          </span>
          <div className="life-rung-body">
            {appMonth.length ? (
              appMonth.map((g) => (
                <p key={g.id} className={`life-rung-item is-${goalStatus(g.status)}${g.focus ? ' is-focus' : ''}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <span>{g.title}</span>
                </p>
              ))
            ) : monthGoals.length ? (
              monthGoals.map((g, i) => (
                <p key={i} className={`life-rung-item is-${g.status}`}>
                  <StatusMark status={g.status} />
                  <span>{g.text}</span>
                </p>
              ))
            ) : (
              <form action={setFocusGoal} className="life-rung-form">
                <input type="hidden" name="horizon" value="month" />
                <input type="hidden" name="period" value={period} />
                <input name="title" required maxLength={200} placeholder={`What is the one thing in ${monthName}?`} aria-label={`The one thing in ${monthName}`} autoComplete="off" />
                <SaveButton>Set</SaveButton>
              </form>
            )}
            {!appMonth.length && !monthGoals.length && (
              <p className="life-rung-empty">
                More goals for {monthName}: <Link href="/life/goals">set them</Link>
              </p>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            {year}
            <small>this year</small>
          </span>
          <div className="life-rung-body">
            {yearGoals.length ? (
              yearGoals.map((g) => (
                <p key={g.id} className={`life-rung-item is-${goalStatus(g.status)}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <span>{g.title}</span>
                </p>
              ))
            ) : (
              <p className="life-rung-empty">
                No goals for {year}. <Link href="/life/goals">Set them</Link>
              </p>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            Five years
            <small>by {Number(year) + 5}</small>
          </span>
          <div className="life-rung-body">
            {vision.length ? (
              vision.map((g) => (
                <p key={g.id} className={`life-rung-item is-${goalStatus(g.status)}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <span>{g.title}</span>
                </p>
              ))
            ) : (
              <p className="life-rung-empty">
                No five-year vision yet. <Link href="/life/goals">Write it</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
