import type { DailyPoint } from '@/lib/life/metrics';
import { addDays, formatDate } from '@/lib/life/metrics';
import { zone } from '@/lib/life/health';

// Recovery per day, one column per week (Monday at the top), newest on the right.
export function RecoveryHeat({ days, today, weeks = 20 }: { days: DailyPoint[]; today: string; weeks?: number }) {
  const byDate = new Map(days.map((p) => [p.date, p.value]));
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -(dow + 7 * (weeks - 1)));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));
  const green = days.filter((p) => zone(p.value) === 'green').length;
  const red = days.filter((p) => zone(p.value) === 'red').length;

  return (
    <div>
      <div className="life-heat-wrap">
        <div className="life-heat" role="img" aria-label={`Recovery by day, last ${weeks} weeks`}>
          {cells.map((d) => {
            const v = byDate.get(d);
            const cls = d > today ? 'is-future' : v === undefined ? '' : `is-${zone(v)}`;
            return <i key={d} className={`${cls}${d === today ? ' is-now' : ''}`} title={`${formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })}: ${v === undefined ? 'no reading' : `${Math.round(v)}%`}`} />;
          })}
        </div>
      </div>
      <div className="life-heat-legend">
        <span><i className="is-green" /> 67% and up</span>
        <span><i className="is-yellow" /> 34 to 66%</span>
        <span><i className="is-red" /> under 34%</span>
        <span>
          {green} green · {red} red of {days.length} days
        </span>
      </div>
    </div>
  );
}
