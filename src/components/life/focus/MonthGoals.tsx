import type { Focus } from '@/lib/life/focus';
import { formatDate } from '@/lib/life/metrics';
import { StatusMark } from './StatusMark';

// The ❸ block from the journal: month goals, week lines, deals, moves.
export function MonthGoals({ month, today, doing }: { month: Focus['month']; today: string; doing?: Focus['doing'] }) {
  if (!month) {
    return <p className="text-sm text-muted">No ❸ block in the journal yet. Month goals, week lines and deals land here once you write them.</p>;
  }
  const weekNo = Math.min(5, Math.ceil(Number(today.slice(8, 10)) / 7));
  const closed = month.deals.filter((d) => d.status === 'hit').length;

  return (
    <div className="space-y-5">
      {month.goals.length > 0 && (
        <ul className="life-goals">
          {month.goals.map((g, i) => (
            <li key={i} className={`life-goal is-${g.status}`}>
              <StatusMark status={g.status} />
              <span className="life-goal-text">{g.text}</span>
            </li>
          ))}
        </ul>
      )}

      {month.weeks.length > 0 && (
        <div>
          <p className="life-stat-k mb-2">Week by week</p>
          <ul className="life-goals">
            {month.weeks.map((w) => (
              <li key={w.week} className={`life-goal is-${w.status}${w.week === weekNo ? ' is-now' : ''}`}>
                <StatusMark status={w.status} />
                <span className="life-goal-text">
                  <span className="text-muted">Week {w.week} · </span>
                  {w.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {month.deals.length > 0 && (
        <div>
          <p className="life-stat-k mb-2">
            Deals that should close · {closed} of {month.deals.length} closed
          </p>
          <ul className="life-goals">
            {month.deals.map((d, i) => (
              <li key={i} className={`life-goal is-${d.status}`}>
                <StatusMark status={d.status} />
                <span className="life-goal-text">
                  {d.name}
                  {d.amount && <span className="text-muted"> · {d.amount}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {month.moves.length > 0 && (
        <div>
          <p className="life-stat-k mb-2">{month.month} moves</p>
          <ul className="life-goals">
            {month.moves.map((m, i) => (
              <li key={i} className={`life-goal is-${m.status}`}>
                <StatusMark status={m.status} />
                <span className="life-goal-text">{m.text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {doing && doing.items.length > 0 && (
        <div>
          <p className="life-stat-k mb-2">Doing · {doing.items.length} open</p>
          <ul className="life-goals">
            {doing.items.slice(0, 12).map((t, i) => (
              <li key={i} className="life-goal is-open">
                <StatusMark status="open" />
                <span className="life-goal-text">{t}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-muted">From the journal, {formatDate(month.date)}. Marks come from the ✅ ❌ 🟡 you type in Notion.</p>
    </div>
  );
}
