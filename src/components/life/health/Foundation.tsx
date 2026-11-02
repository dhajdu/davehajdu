import Link from 'next/link';
import type { Health } from '@/lib/life/health';
import type { LabReading } from '@/lib/life/labs';
import { ZONE_WORD, zone } from '@/lib/life/health';
import { addDays, formatDate, formatNumber } from '@/lib/life/metrics';
import { Ring } from './Ring';
import { Stat } from './Stat';

// Health as the foundation of the day: the recovery ring, the signals that
// drive it, and the last two weeks of recovery as dots.
export function Foundation({ health, today, weightTarget, hba1c, hba1cTarget }: { health: Health; today: string; weightTarget?: number | null; hba1c?: LabReading | null; hba1cTarget?: number | null }) {
  const rec = health.stats.recovery.last;
  const z = rec ? zone(rec.value) : null;
  const byDate = new Map(health.recoveryDays.map((p) => [p.date, p.value]));
  const dots = Array.from({ length: 14 }, (_, i) => addDays(today, i - 13));

  return (
    <div className="life-found">
      <div className="life-found-ring">
        <Ring value={rec?.value ?? null} zone={z} />
        <span className={`life-zone${z ? ` is-${z}` : ''}`}>{z ? ZONE_WORD[z] : 'No recovery yet'}</span>
        {rec && <span className="life-dots-label">{rec.date === today ? 'today' : formatDate(rec.date, { month: 'short', day: 'numeric' })}</span>}
      </div>
      <div className="life-found-stats">
        <Stat stat={health.stats.sleep} vs="avg7" label="Sleep" />
        <Stat stat={health.stats.strain} vs="avg7" label="Strain" />
        <Stat stat={health.stats.hrv} label="HRV" />
        <Stat stat={health.stats.rhr} label="Resting HR" />
        <Stat stat={health.stats.weight} target={weightTarget ?? undefined} label="Weight" />
        {hba1c?.latest && (
          <div>
            <p className="life-stat-k">HbA1c</p>
            <p className="life-stat-v">
              {formatNumber(hba1c.latest.value, '%')}
              <small>%</small>
            </p>
            <p className={`life-stat-d${hba1c.band === 'out' ? ' is-worse' : ' is-better'}`}>
              {hba1cTarget != null
                ? `${formatNumber(hba1c.latest.value - hba1cTarget, '%')} vs goal ${formatNumber(hba1cTarget, '%')}`
                : hba1c.band === 'out'
                  ? 'Out of range'
                  : 'In range'}
            </p>
          </div>
        )}
      </div>
      <div className="life-found-foot">
        <div className="flex items-center gap-3">
          <span className="life-dots-row" aria-label="Recovery, last 14 days">
            {dots.map((d) => {
              const v = byDate.get(d);
              return <i key={d} className={`${v === undefined ? '' : `is-${zone(v)}`}${d === today ? ' is-now' : ''}`} title={`${formatDate(d, { month: 'short', day: 'numeric' })}: ${v === undefined ? 'no reading' : `${Math.round(v)}% recovery`}`} />;
            })}
          </span>
          <span className="life-dots-label">Recovery, last 14 days</span>
        </div>
        <Link href="/life/health" className="text-xs font-semibold text-blue">Fitness</Link>
      </div>
    </div>
  );
}
