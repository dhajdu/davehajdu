import Link from 'next/link';
import type { Labs } from '@/lib/life/labs';
import { rangeLabel, type LabRow } from '@/lib/life/labs';
import { formatDate, trendTone } from '@/lib/life/metrics';

// Lab values keep the lab's precision (6.63, not 6.6).
const fmt = (v: number) => v.toLocaleString('en-US', { maximumFractionDigits: 3 });

const CATEGORY: Record<string, string> = {
  hematology: 'Hematology',
  hba1c: 'HbA1c',
  biochemistry: 'Biochemistry',
  lipids: 'Lipids',
  liver: 'Liver',
  inflammation: 'Inflammation',
  iron: 'Iron',
  immunology: 'Immunology',
  hormones: 'Hormones',
  vitamins: 'Vitamins',
  urine: 'Urine',
};
const FLAG: Record<LabRow['flag'], string> = { normal: '', low: 'Low', high: 'High', abnormal: 'Abnormal' };

// The whole report as a table, grouped by section, flagged rows marked.
function FullPanel({ rows }: { rows: LabRow[] }) {
  const groups: { key: string; rows: LabRow[] }[] = [];
  for (const r of rows) {
    if (groups[groups.length - 1]?.key !== r.category) groups.push({ key: r.category, rows: [] });
    groups[groups.length - 1].rows.push(r);
  }
  const flagged = rows.filter((r) => r.flag !== 'normal').length;
  return (
    <details className="life-lab-full">
      <summary>
        Full panel · {rows.length} results · {flagged} flagged
      </summary>
      {groups.map((g) => (
        <section key={g.key} className="life-lab-group">
          <h3>{CATEGORY[g.key] ?? g.key}</h3>
          <table>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.id} className={r.flag !== 'normal' ? 'is-flagged' : undefined}>
                  <td className="life-lab-analyte">{r.analyte}</td>
                  <td className="life-lab-value">
                    {r.value !== null ? fmt(Number(r.value)) : ''}
                    {r.value !== null && r.value_text ? ' · ' : ''}
                    {r.value_text ?? ''}
                    {r.unit ? <span className="text-muted"> {r.unit}</span> : null}
                  </td>
                  <td className="life-lab-ref">{r.ref_text}</td>
                  <td className="life-lab-flag">{FLAG[r.flag]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </details>
  );
}

type Goal = { metricSlug: string; target: number };

// The latest blood panel: one tile per marker, read against its reference
// range, with the goal where one is set and the change since the last panel.
export function Bloodwork({ labs, goals, today }: { labs: Labs; goals: Goal[]; today: string }) {
  if (!labs.panelDate) return <p className="text-sm text-muted">No lab results yet.</p>;
  const out = labs.readings.filter((r) => r.band === 'out').length;
  const short = (d: string) => formatDate(d, { month: 'short', day: 'numeric' });
  const due = labs.retest
    ? labs.retest.to < today
      ? 'Retest overdue'
      : labs.retest.from <= today
        ? `Retest window open until ${short(labs.retest.to)}`
        : `Retest ${short(labs.retest.from)} to ${short(labs.retest.to)}`
    : null;

  return (
    <div>
      <div className="life-lab-head">
        <span>
          Panel of {formatDate(labs.panelDate)} · {out} of {labs.readings.length} out of range
        </span>
        <span className="flex gap-3">
          {due && <span>{due}</span>}
          {labs.report && (
            <Link href={`/api/life/documents/${labs.report.id}`} target="_blank" className="font-semibold text-blue">
              Report
            </Link>
          )}
        </span>
      </div>
      <ul className="life-lab">
        {labs.readings.map((r) => {
          const goal = goals.find((g) => g.metricSlug === r.metric.slug);
          const v = r.latest;
          const delta = v && r.previous ? v.value - r.previous.value : null;
          const tone = delta === null ? null : trendTone(delta, r.metric.direction);
          return (
            <li key={r.metric.id} className={`life-lab-tile${r.band ? ` is-${r.band}` : ''}`}>
              <span className="life-stat-k">{r.metric.name}</span>
              <span className="life-stat-v">
                {v ? fmt(v.value) : '–'}
                {v && r.metric.unit && <small>{r.metric.unit}</small>}
              </span>
              <span className="life-lab-range">
                {r.band === 'out' ? 'Out of range' : r.band === 'in' ? 'In range' : 'No reading'}
                {rangeLabel(r.metric) ? ` · ${rangeLabel(r.metric)}` : ''}
              </span>
              {goal && v && (
                <span className="life-lab-goal">
                  Goal {fmt(goal.target)} · {fmt(Math.abs(v.value - goal.target))} to go
                </span>
              )}
              {delta !== null && r.previous && (
                <span className={`life-stat-d${tone === 'better' ? ' is-better' : tone === 'worse' ? ' is-worse' : ''}`}>
                  {delta > 0 ? '▲' : delta < 0 ? '▼' : '='} {fmt(Math.abs(delta))} since {formatDate(r.previous.date, { month: 'short', year: 'numeric' })}
                </span>
              )}
              {r.metric.ref_note && <span className="life-lab-note">{r.metric.ref_note}</span>}
            </li>
          );
        })}
      </ul>
      {labs.rows.length > 0 && <FullPanel rows={labs.rows} />}
    </div>
  );
}
