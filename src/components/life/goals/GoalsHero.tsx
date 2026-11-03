import type { GoalRow } from '@/lib/life/focus';

// The top of the goals page: the route from today to five years out, one
// numbered milestone per horizon with how much of it is on track, and the
// vision statement where the route is heading.
export type Milestone = { key: string; label: string; when: string; total: number; onTrack: number; hit: number };

export function milestoneOf(key: string, label: string, when: string, rows: GoalRow[]): Milestone {
  return {
    key,
    label,
    when,
    total: rows.length,
    onTrack: rows.filter((g) => g.status === 'open' || g.status === 'hit').length,
    hit: rows.filter((g) => g.status === 'hit').length,
  };
}

const X = [60, 200, 340, 480, 620];
const Y = [150, 122, 92, 58, 24];

export function GoalsHero({ statement, milestones }: { statement: string | null; milestones: Milestone[] }) {
  const path = X.map((x, i) => `${i === 0 ? 'M' : 'L'}${x} ${Y[i]}`).join(' ');
  return (
    <section className="life-summit" aria-label="The route">
      <div className="life-summit-route">
        <svg viewBox="0 0 680 190" className="life-summit-svg" aria-hidden>
          <path d={path} className="life-summit-path-shadow" />
          <path d={path} className="life-summit-path" />
          <path d={`M${X[4]} ${Y[4]} l0 -20 l18 7 l-18 7`} className="life-summit-flag" />
          {milestones.map((m, i) => (
            <g key={m.key}>
              <circle cx={X[i]} cy={Y[i]} r={16} className={`life-summit-node${i === 0 ? ' is-now' : ''}`} />
              <text x={X[i]} y={Y[i] + 5} className="life-summit-num" textAnchor="middle">{i + 1}</text>
            </g>
          ))}
        </svg>
        <ol className="life-summit-legend">
          {milestones.map((m, i) => (
            <li key={m.key} className={i === 0 ? 'is-now' : undefined}>
              <span className="life-summit-legend-label">{m.label}</span>
              <span className="life-summit-legend-when">{m.when}</span>
              <span className="life-summit-legend-n">{m.total === 0 ? 'nothing set' : `${m.onTrack} of ${m.total} on track`}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="life-summit-aim">
        <span className="life-eyebrow">Where the route goes</span>
        <p className="life-summit-statement">{statement ?? 'No vision statement yet'}</p>
      </div>
    </section>
  );
}
