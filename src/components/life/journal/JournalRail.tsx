import Link from 'next/link';
import type { Focus, GoalRow } from '@/lib/life/focus';
import { doneCount, parseRoutine, type Reference, type TodoNode } from '@/lib/life/journal';
import { formatDate } from '@/lib/life/format';
import { weekOfMonth } from '@/lib/life/metrics';
import { Markdown } from '@/components/life/Markdown';
import { StatusMark, goalStatus } from '@/components/life/focus/StatusMark';
import { DoneList } from '@/components/life/journal/TodoList';

// What stays in view while writing: the vision, the year, the month and the
// week from Goals, what got done on the day, plus the reference blocks the
// Notion template carried.
export function JournalRail({ focus, goals, refs, today, week: weekKey, date, done }: { focus: Focus; goals: GoalRow[]; refs: Reference[]; today: string; week: string; date: string; done: TodoNode[] }) {
  const vision = goals.filter((g) => g.horizon === 'vision');
  const year = goals.filter((g) => g.horizon === 'year');
  const monthName = new Date(`${today.slice(0, 7)}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' });
  // The journal's ❸ block only speaks for the month it names.
  const journalMonth = focus.month && focus.month.month.trim().toLowerCase() === monthName.toLowerCase() ? focus.month : null;
  const weekNo = Math.min(5, Math.ceil(Number(today.slice(8, 10)) / 7));
  const weeks = journalMonth?.weeks ?? [];
  const week = weeks.find((w) => w.week === weekNo) ?? weeks[weeks.length - 1];
  const monthGoals = journalMonth ? (journalMonth.goals.length ? journalMonth.goals : journalMonth.moves) : [];
  const appMonth = goals.filter((g) => g.horizon === 'month' && g.period === today.slice(0, 7));
  const appWeek = goals.filter((g) => g.horizon === 'week' && g.period === weekKey);
  const trackWord = (g: GoalRow) => (g.track === 'health' ? 'Health' : 'Business');

  return (
    <aside className="life-rail" aria-label="Keep in mind">
      <details open>
        <summary>Five years</summary>
        {vision.length ? (
          <ul className="life-goals">
            {vision.map((g) => (
              <li key={g.id} className={`life-goal is-${goalStatus(g.status)}`}>
                <StatusMark status={goalStatus(g.status)} />
                <span className="life-goal-text">{g.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing yet. <Link href="/life/goals" className="text-blue font-semibold">Write it</Link></p>
        )}
      </details>

      <details open>
        <summary>{today.slice(0, 4)}</summary>
        {year.length ? (
          <ul className="life-goals">
            {year.map((g) => (
              <li key={g.id} className={`life-goal is-${goalStatus(g.status)}`}>
                <StatusMark status={goalStatus(g.status)} />
                <span className="life-goal-text">{g.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No goals for the year yet.</p>
        )}
      </details>

      <details open>
        <summary>{monthName}</summary>
        {appMonth.length || appWeek.length || monthGoals.length || week ? (
          <ul className="life-goals">
            {appMonth.map((g) => (
              <li key={g.id} className={`life-goal is-${goalStatus(g.status)}${g.focus ? ' is-now' : ''}`}>
                <StatusMark status={goalStatus(g.status)} />
                <span className="life-goal-text">
                  <span className="text-muted">{trackWord(g)} · </span>
                  {g.title}
                </span>
              </li>
            ))}
            {appWeek.map((g) => (
              <li key={g.id} className={`life-goal is-${goalStatus(g.status)} is-now`}>
                <StatusMark status={goalStatus(g.status)} />
                <span className="life-goal-text">
                  <span className="text-muted">Week {weekOfMonth(weekKey)}, {trackWord(g).toLowerCase()} · </span>
                  {g.title}
                </span>
              </li>
            ))}
            {!appMonth.length && monthGoals.map((g, i) => (
              <li key={i} className={`life-goal is-${g.status}`}>
                <StatusMark status={g.status} />
                <span className="life-goal-text">{g.text}</span>
              </li>
            ))}
            {week && (
              <li className={`life-goal is-${week.status} is-now`}>
                <StatusMark status={week.status} />
                <span className="life-goal-text">
                  <span className="text-muted">Week {week.week} · </span>
                  {week.text}
                </span>
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-muted">Nothing set for {monthName} yet. <Link href="/life" className="text-blue font-semibold">Set it on Today</Link></p>
        )}
      </details>

      <details open>
        <summary>Done {date === today ? 'today' : `on ${formatDate(date, { month: 'short', day: 'numeric' })}`} · {doneCount(done, date)}</summary>
        <DoneList date={date} done={done} />
      </details>

      {refs.map((r) => {
        const steps = r.key === 'routine' ? parseRoutine(r.lines) : [];
        return (
          <details key={r.key} open={r.key === 'routine'}>
            <summary>{r.title}</summary>
            {steps.length ? (
              <ol className="life-routine">
                {steps.map((st, i) => (
                  <li key={i}>
                    <span className="life-routine-time">{st.time}</span>
                    <span className="life-routine-what">{st.activity}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Markdown lines={r.lines} />
            )}
          </details>
        );
      })}

      <p className="life-rail-foot">
        <Link href="/life/goals">Goals</Link>
      </p>
    </aside>
  );
}
