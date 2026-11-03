import Link from 'next/link';
import type { GoalRow } from '@/lib/life/focus';
import { hitRate, type MonthRecord, type Tally } from '@/lib/life/record';
import { periodLabel } from '@/lib/life/metrics';
import { gradeTone } from '@/lib/life/month-review';
import { Markdown } from '@/components/life/Markdown';
import { GoalLine } from './GoalList';

// The year at a glance: one cell per month, coloured by how much landed.
export function YearStrip({ year, records, period }: { year: string; records: MonthRecord[]; period: string }) {
  const byPeriod = new Map(records.map((r) => [r.period, r]));
  return (
    <div className="life-year-strip" role="img" aria-label={`${year}, month by month`}>
      {Array.from({ length: 12 }, (_, i) => {
        const p = `${year}-${String(i + 1).padStart(2, '0')}`;
        const r = byPeriod.get(p);
        const rate = r ? hitRate(r.tally) : null;
        const cls = p > period ? 'is-future' : p === period ? 'is-now' : rate === null ? 'is-empty' : rate >= 0.67 ? 'is-green' : rate >= 0.34 ? 'is-yellow' : 'is-red';
        return (
          <span key={p} className={`life-year-cell ${cls}`} title={r ? `${periodLabel(p, 'short')}: ${r.tally.hit} hit, ${r.tally.partial} partly, ${r.tally.missed} missed` : periodLabel(p, 'short')}>
            <i />
            <small>{new Date(`${p}-01T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}</small>
          </span>
        );
      })}
    </div>
  );
}

export function TallyBar({ t }: { t: Tally }) {
  const total = t.hit + t.partial + t.missed + t.open;
  if (!total) return null;
  const w = (n: number) => `${(n / total) * 100}%`;
  return (
    <div className="life-tally-bar" role="img" aria-label={`${t.hit} hit, ${t.partial} partly, ${t.missed} missed, ${t.open} open`}>
      {t.hit > 0 && <span className="is-hit" style={{ width: w(t.hit) }} />}
      {t.partial > 0 && <span className="is-partial" style={{ width: w(t.partial) }} />}
      {t.missed > 0 && <span className="is-missed" style={{ width: w(t.missed) }} />}
      {t.open > 0 && <span className="is-open" style={{ width: w(t.open) }} />}
    </div>
  );
}

export function MonthCard({ r, open }: { r: MonthRecord; open: boolean }) {
  const t = r.tally;
  const rate = hitRate(t);
  return (
    <details className="life-record-month" open={open}>
      <summary>
        <span className="life-record-when">
          <b>{periodLabel(r.period, 'long').split(' ')[0]}</b>
          <small>{r.period.slice(0, 4)}</small>
        </span>
        <span className="life-record-mid">
          <TallyBar t={t} />
          <span className="life-tally">
            <b>{t.hit} hit</b>
            {t.partial > 0 && <em>{t.partial} partly</em>}
            <i>{t.missed} missed</i>
            {rate !== null && <span className="life-record-rate">{Math.round(rate * 100)}%</span>}
          </span>
        </span>
        <span className="life-grades-mini" title="Health and business grades">
          <span className={`is-${gradeTone(r.review?.grade_health ?? null)}`}>{r.review?.grade_health ?? '–'}</span>
          <span className={`is-${gradeTone(r.review?.grade_business ?? null)}`}>{r.review?.grade_business ?? '–'}</span>
        </span>
      </summary>
      <div className="life-record-body">
        {r.review?.headline && (
          <p className="life-record-headline">
            {r.review.headline} <Link href={`/life/review/${r.period}`}>The review</Link>
          </p>
        )}
        {(r.goals.length > 0 || r.weekGoals.length > 0) && (
          <ul className="life-goals">
            {r.goals.map((g) => (
              <GoalLine key={g.id} g={g} />
            ))}
            {r.weekGoals.map((g) => (
              <GoalLine key={g.id} g={{ ...g, title: `Week of ${g.period?.slice(5).replace('-', '/')} · ${g.title}` }} />
            ))}
          </ul>
        )}
        {r.lines.length > 0 && (
          <div className="life-record-journal">
            <p className="life-stat-k">From the journal</p>
            <Markdown lines={r.lines} />
          </div>
        )}
        {r.goals.length === 0 && r.weekGoals.length === 0 && r.lines.length === 0 && <p className="text-sm text-muted">Nothing recorded for this month.</p>}
      </div>
    </details>
  );
}

export function Achieved({ rows }: { rows: GoalRow[] }) {
  if (!rows.length) return <p className="text-sm text-muted">Nothing achieved yet this year. The year is young.</p>;
  return (
    <ul className="life-achieved">
      {rows.map((g) => (
        <li key={g.id} className={`is-${g.track}`}>
          <span className="life-mark is-hit">✓</span>
          <span>{g.title}</span>
        </li>
      ))}
    </ul>
  );
}
