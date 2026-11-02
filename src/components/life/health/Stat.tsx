import type { HealthStat } from '@/lib/life/health';
import { fmtHours } from '@/lib/life/health';
import { formatNumber, trendTone } from '@/lib/life/metrics';

// One number with its unit and a delta line. `vs` compares the latest reading
// to the 7-day or 30-day average; `target` compares it to a goal.
export function Stat({ stat, vs = 'avg30', target, label }: { stat: HealthStat; vs?: 'avg7' | 'avg30'; target?: number | null; label?: string }) {
  const last = stat.last;
  const isHours = stat.unit === 'hours';
  const value = last === null ? '–' : isHours ? fmtHours(last.value) : formatNumber(last.value, stat.unit);
  const unit = last === null || isHours ? null : stat.unit === '%' ? '%' : stat.unit === 'count' ? null : stat.unit;

  let delta: { text: string; tone: 'better' | 'worse' | 'neutral' } | null = null;
  if (last) {
    if (target != null) {
      const d = last.value - target;
      // Within 2% of the goal counts as on target (same rule as goalHit in metrics.ts).
      const tone = Math.abs(d) <= Math.abs(target) * 0.02 ? 'better' : stat.direction === 'target' ? 'worse' : trendTone(d, stat.direction);
      delta = { text: `${d > 0 ? '+' : ''}${formatNumber(d, stat.unit)} vs goal ${formatNumber(target, stat.unit)}`, tone };
    } else {
      const ref = stat[vs];
      if (ref !== null) {
        const d = last.value - ref;
        const n = isHours ? `${Math.abs(Math.round(d * 60))}m` : formatNumber(Math.abs(d), stat.unit);
        delta = { text: `${d > 0 ? '▲' : d < 0 ? '▼' : '='} ${n} vs ${vs === 'avg7' ? '7' : '30'}-day avg`, tone: trendTone(d, stat.direction) };
      }
    }
  }

  return (
    <div>
      <p className="life-stat-k">{label ?? stat.name}</p>
      <p className="life-stat-v">
        {value}
        {unit && <small>{unit}</small>}
      </p>
      {delta && <p className={`life-stat-d${delta.tone === 'better' ? ' is-better' : delta.tone === 'worse' ? ' is-worse' : ''}`}>{delta.text}</p>}
    </div>
  );
}
