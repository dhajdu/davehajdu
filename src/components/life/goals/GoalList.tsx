import type { GoalRow, Track } from '@/lib/life/focus';
import { TRACKS } from '@/lib/life/focus';
import { formatValue, type MetricDef } from '@/lib/life/metrics';
import { primaryButtonClass } from '@/components/life/ui';
import { StatusMark, goalStatus, type GoalStatus } from '@/components/life/focus/StatusMark';
import { addLongGoal } from '@/app/life/(app)/goals/actions';
import { GoalCard } from './GoalCard';

const input = 'w-full text-sm';
type Area = { id: string; name: string };
type Horizon = 'vision' | 'year' | 'month' | 'week';

// A past goal, read only, for the track record.
export function GoalLine({ g }: { g: GoalRow }) {
  return (
    <li className={`life-goal is-${goalStatus(g.status)}${g.focus ? ' is-now' : ''}`}>
      <StatusMark status={goalStatus(g.status)} />
      <div className="min-w-0 flex-1">
        <p className="life-goal-text">
          {g.focus && <span className="text-muted">The one thing · </span>}
          {g.title}
        </p>
        {(g.area || (g.metric && g.target_value !== null)) && (
          <p className="life-goal-meta">
            {g.track === 'health' ? 'Health' : 'Business'}
            {g.area ? ` · ${g.area.name}` : ''}
            {g.metric && g.target_value !== null ? ` · ${g.metric.name} ${formatValue(Number(g.target_value), g.metric.unit)}` : ''}
          </p>
        )}
      </div>
    </li>
  );
}

export function AddForm({ horizon, areas, metrics, period, track, label }: { horizon: Horizon; areas: Area[]; metrics: MetricDef[]; period?: string; track?: Track; label?: string }) {
  const what = horizon === 'vision' ? 'Where I want to be in five years' : horizon === 'year' ? 'What this year has to deliver' : horizon === 'month' ? 'What this month has to deliver' : 'What this week has to deliver';
  return (
    <details className="life-add-wrap">
      <summary>{label ?? 'Add a goal'}</summary>
      <form action={addLongGoal} className="life-add mt-3">
        <input type="hidden" name="horizon" value={horizon} />
        {period && <input type="hidden" name="period" value={period} />}
        {track && <input type="hidden" name="track" value={track} />}
        <input name="title" required maxLength={200} placeholder={what} className={input} />
        <div className="life-add-row">
          {!track && (
            <select name="track" required defaultValue="" className={input} aria-label="Track">
              <option value="" disabled>Health or business</option>
              {TRACKS.map((t) => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>
          )}
          <select name="area_id" required defaultValue="" className={input} aria-label="Area">
            <option value="" disabled>Area</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <select name="metric_id" defaultValue="" className={input} aria-label="Metric">
            <option value="">No metric</option>
            {metrics.map((m) => (
              <option key={m.id} value={m.id}>{m.name}{m.unit ? ` (${m.unit})` : ''}</option>
            ))}
          </select>
          <input name="target_value" type="number" step="any" inputMode="decimal" placeholder="Target" className={input} aria-label="Target" />
        </div>
        <div>
          <button type="submit" className={primaryButtonClass}>Add</button>
        </div>
      </form>
    </details>
  );
}

const SHORT_STATES: GoalStatus[] = ['open', 'behind', 'hit', 'missed'];
const LONG_STATES: GoalStatus[] = ['open', 'behind', 'hit'];

// One column of the board: a horizon's goals as cards, health first, then an add form.
export function BoardColumn({ num, title, when, rows, horizon, period, areas, metrics }: { num: number; title: string; when: string; rows: GoalRow[]; horizon: Horizon; period?: string; areas: Area[]; metrics: MetricDef[] }) {
  const ordered = [...rows].sort((a, b) => (a.track === b.track ? 0 : a.track === 'health' ? -1 : 1));
  const onTrack = rows.filter((g) => g.status === 'open' || g.status === 'hit').length;
  return (
    <section className="life-board-col" aria-label={title}>
      <header className="life-board-head">
        <span className="life-board-num">{num}</span>
        <div>
          <h2 className="life-board-title">{title}</h2>
          <p className="life-board-when">
            {when}
            {rows.length > 0 && <span> · {onTrack} of {rows.length} on track</span>}
          </p>
        </div>
      </header>
      {ordered.length === 0 ? (
        <p className="life-board-empty">Nothing set yet.</p>
      ) : (
        <ul className="life-board-cards">
          {ordered.map((g) => (
            <GoalCard key={g.id} goal={g} states={horizon === 'vision' || horizon === 'year' ? LONG_STATES : SHORT_STATES} />
          ))}
        </ul>
      )}
      <AddForm horizon={horizon} areas={areas} metrics={metrics} period={period} />
    </section>
  );
}
