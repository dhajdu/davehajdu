import type { DailyPoint } from '@/lib/life/metrics';
import { addDays, formatDate } from '@/lib/life/metrics';

export type HeatBand = { cls: string; label: string };

// One cell per day, one column per week (Monday at the top), newest on the
// right. `band` maps a value to a class; the legend explains the classes.
export function DayHeat({
  days,
  today,
  weeks = 20,
  label,
  band,
  legend,
  summary,
  unit = '',
}: {
  days: DailyPoint[];
  today: string;
  weeks?: number;
  label: string;
  band: (v: number) => string;
  legend: HeatBand[];
  summary?: string;
  unit?: string;
}) {
  const byDate = new Map(days.map((p) => [p.date, p.value]));
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // Monday = 0
  const start = addDays(today, -(dow + 7 * (weeks - 1)));
  const cells = Array.from({ length: weeks * 7 }, (_, i) => addDays(start, i));

  return (
    <div>
      <div className="life-heat-wrap">
        <div className="life-heat" role="img" aria-label={`${label}, last ${weeks} weeks`}>
          {cells.map((d) => {
            const v = byDate.get(d);
            const cls = d > today ? 'is-future' : v === undefined ? '' : band(v);
            return (
              <i
                key={d}
                className={`${cls}${d === today ? ' is-now' : ''}`}
                title={`${formatDate(d, { weekday: 'short', month: 'short', day: 'numeric' })}: ${v === undefined ? 'no reading' : `${Math.round(v * 10) / 10}${unit}`}`}
              />
            );
          })}
        </div>
      </div>
      <div className="life-heat-legend">
        {legend.map((l) => (
          <span key={l.cls}>
            <i className={l.cls} /> {l.label}
          </span>
        ))}
        {summary && <span>{summary}</span>}
      </div>
    </div>
  );
}
