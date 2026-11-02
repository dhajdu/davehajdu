import Link from 'next/link';
import type { Focus, GoalRow } from '@/lib/life/focus';
import { formatDate } from '@/lib/life/metrics';
import { StatusMark, goalStatus } from './StatusMark';

// The question the app answers, as one ladder: today, this week, this month,
// this year, five years. Today and the month come from the journal; the year
// and the vision come from the goals table.
export function FocusLadder({ focus, goals, today }: { focus: Focus; goals: GoalRow[]; today: string }) {
  const year = today.slice(0, 4);
  const dayOfMonth = Number(today.slice(8, 10));
  const weekNo = Math.min(5, Math.ceil(dayOfMonth / 7));
  const weeks = focus.month?.weeks ?? [];
  const week = weeks.find((w) => w.week === weekNo) ?? weeks[weeks.length - 1];
  const monthGoals = focus.month?.goals.length ? focus.month.goals : (focus.month?.moves ?? []);
  const yearGoals = goals.filter((g) => g.horizon === 'year');
  const vision = goals.filter((g) => g.horizon === 'vision');
  const short = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });

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
            {focus.oneThing && focus.oneThing.date !== today && <small>written {short(focus.oneThing.date)}</small>}
          </span>
          <div className="life-rung-body">
            {focus.oneThing ? (
              <p className="life-rung-text">{focus.oneThing.text}</p>
            ) : (
              <p className="life-rung-empty">No One Thing in the journal yet. Write it under ❶ and it lands here.</p>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            This week
            {week && <small>week {week.week}</small>}
          </span>
          <div className="life-rung-body">
            {week ? (
              <p className={`life-rung-item is-${week.status}`}>
                <StatusMark status={week.status} />
                <span>{week.text}</span>
              </p>
            ) : (
              <p className="life-rung-empty">No week line under ❸ yet.</p>
            )}
          </div>
        </div>

        <div className="life-rung">
          <span className="life-rung-dot" />
          <span className="life-rung-label">
            {focus.month?.month ?? 'This month'}
            {focus.month && <small>from {short(focus.month.date)}</small>}
          </span>
          <div className="life-rung-body">
            {monthGoals.length ? (
              monthGoals.map((g, i) => (
                <p key={i} className={`life-rung-item is-${g.status}`}>
                  <StatusMark status={g.status} />
                  <span>{g.text}</span>
                </p>
              ))
            ) : (
              <p className="life-rung-empty">No month goals under ❸ yet.</p>
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
