import type { Metadata } from 'next';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { FocusLadder } from '@/components/life/focus/FocusLadder';
import { MonthGoals } from '@/components/life/focus/MonthGoals';
import { StatusMark, goalStatus } from '@/components/life/focus/StatusMark';
import { VisionCard } from '@/components/life/focus/VisionCard';
import { Markdown } from '@/components/life/Markdown';
import { getFocus, getLongGoals, type GoalRow } from '@/lib/life/focus';
import { METRIC_COLUMNS, currentPeriod, formatValue, getAreas, ictToday, periodLabel, type MetricDef } from '@/lib/life/metrics';
import { addLongGoal, renameLongGoal, setLongGoalStatus } from './actions';

export const metadata: Metadata = { title: 'Goals', robots: { index: false, follow: false } };

const input = 'w-full text-sm';

function Actions({ g }: { g: GoalRow }) {
  const others = (['hit', 'missed', 'open', 'dropped'] as const).filter((s) => s !== g.status);
  return (
    <div className="life-goal-actions">
      {others.map((s) => (
        <form key={s} action={setLongGoalStatus}>
          <input type="hidden" name="goal_id" value={g.id} />
          <input type="hidden" name="status" value={s} />
          <button type="submit">{s === 'open' ? 'Reopen' : s === 'dropped' ? 'Drop' : `Mark ${s}`}</button>
        </form>
      ))}
      <details className="inline">
        <summary className="cursor-pointer text-xs font-semibold text-blue list-none">Rename</summary>
        <form action={renameLongGoal} className="flex gap-2 mt-2">
          <input type="hidden" name="goal_id" value={g.id} />
          <input name="title" defaultValue={g.title} required maxLength={200} className={input} aria-label="Title" />
          <button type="submit" className={buttonClass}>Save</button>
        </form>
      </details>
    </div>
  );
}

function AddForm({ horizon, areas, metrics, period, focus, label }: { horizon: 'vision' | 'year' | 'month'; areas: { id: string; name: string }[]; metrics: MetricDef[]; period?: string; focus?: boolean; label?: string }) {
  return (
    <details className="mt-4">
      <summary className="cursor-pointer text-xs font-semibold text-blue">{label ?? `Add ${horizon === 'vision' ? 'a vision goal' : horizon === 'month' ? 'a goal for this month' : 'a goal for this year'}`}</summary>
      <form action={addLongGoal} className="life-add mt-3">
        <input type="hidden" name="horizon" value={horizon} />
        {period && <input type="hidden" name="period" value={period} />}
        {focus && <input type="hidden" name="focus" value="1" />}
        <input name="title" required maxLength={200} placeholder={focus ? 'The one thing that makes everything else easier this month' : horizon === 'vision' ? 'Where I want to be in five years' : horizon === 'month' ? 'What this month has to deliver' : 'What this year has to deliver'} className={input} />
        <div className="life-add-row">
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

export default async function GoalsPage() {
  const { supabase } = await requireOwner();
  const today = ictToday();
  const year = today.slice(0, 4);
  const period = currentPeriod();

  const [focus, goals, areas, metricsRes] = await Promise.all([
    getFocus(supabase, today),
    getLongGoals(supabase, period),
    getAreas(supabase),
    supabase.from('metrics').select(METRIC_COLUMNS).order('name'),
  ]);
  const metrics = (metricsRes.data ?? []) as MetricDef[];
  const vision = goals.filter((g) => g.horizon === 'vision');
  const yearGoals = goals.filter((g) => g.horizon === 'year');
  const monthGoals = goals.filter((g) => g.horizon === 'month');
  const monthFocus = monthGoals.find((g) => g.focus) ?? null;

  const tally = (lines: string[]) => {
    const text = lines.join('\n');
    const hit = (text.match(/✅/g) ?? []).length;
    const missed = (text.match(/❌/g) ?? []).length;
    return { hit, missed };
  };

  return (
    <div className="max-w-5xl">
      <PageHeader title="Goals" subtitle="Am I living the life I intend to live? The ladder runs from today to five years out." />

      <FocusLadder focus={focus} goals={goals} today={today} />

      <section className="life-section">
        <div className="life-section-head">
          <h2 className="life-section-title">Five-year vision</h2>
          <span className="life-section-sub">By {Number(year) + 5} · pulled from the journal, edit freely</span>
        </div>
        {vision.length === 0 ? (
          <p className="text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul className="life-vision">
            {vision.map((g) => (
              <VisionCard key={g.id} goal={g} rename={renameLongGoal} setStatus={setLongGoalStatus} />
            ))}
          </ul>
        )}
        <AddForm horizon="vision" areas={areas} metrics={metrics} />
      </section>

      <div className="grid lg:grid-cols-2 gap-4 life-section">
        <Card title={`${year}`}>
          {yearGoals.length === 0 ? (
            <p className="text-sm text-muted">No goals for {year} yet.</p>
          ) : (
            <ul className="life-goals">
              {yearGoals.map((g) => (
                <li key={g.id} className={`life-goal is-${goalStatus(g.status)}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <div className="min-w-0">
                    <p className="life-goal-text">{g.title}</p>
                    <p className="life-goal-meta">
                      {g.area?.name}
                      {g.metric && g.target_value !== null ? ` · ${g.metric.name} ${formatValue(Number(g.target_value), g.metric.unit)}` : ''}
                    </p>
                    <Actions g={g} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AddForm horizon="year" areas={areas} metrics={metrics} />
        </Card>

        <Card title={periodLabel(period)}>
          <p className="life-stat-k mb-2">The one thing this month</p>
          {monthFocus ? (
            <ul className="life-goals mb-3">
              <li className={`life-goal is-${goalStatus(monthFocus.status)} is-now`}>
                <StatusMark status={goalStatus(monthFocus.status)} />
                <div className="min-w-0">
                  <p className="life-goal-text">{monthFocus.title}</p>
                  <Actions g={monthFocus} />
                </div>
              </li>
            </ul>
          ) : (
            <p className="text-sm text-muted mb-1">Not set yet.</p>
          )}
          <AddForm horizon="month" areas={areas} metrics={metrics} period={period} focus label={monthFocus ? 'Replace the one thing' : 'Set the one thing'} />

          <p className="life-stat-k mt-5 mb-2">Goals</p>
          {monthGoals.filter((g) => !g.focus).length === 0 ? (
            <p className="text-sm text-muted">No goals for {periodLabel(period, 'long').split(' ')[0]} yet.</p>
          ) : (
            <ul className="life-goals">
              {monthGoals.filter((g) => !g.focus).map((g) => (
                <li key={g.id} className={`life-goal is-${goalStatus(g.status)}`}>
                  <StatusMark status={goalStatus(g.status)} />
                  <div className="min-w-0">
                    <p className="life-goal-text">{g.title}</p>
                    <p className="life-goal-meta">
                      {g.area?.name}
                      {g.metric && g.target_value !== null ? ` · ${g.metric.name} ${formatValue(Number(g.target_value), g.metric.unit)}` : ''}
                    </p>
                    <Actions g={g} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <AddForm horizon="month" areas={areas} metrics={metrics} period={period} />

          {focus.month && (
            <details className="mt-5">
              <summary className="cursor-pointer text-xs font-semibold text-blue">From the journal · {focus.month.month}</summary>
              <div className="mt-3">
                <MonthGoals month={focus.month} today={today} doing={focus.doing} />
              </div>
            </details>
          )}
        </Card>
      </div>

      <section className="life-section">
        <div className="life-section-head">
          <h2 className="life-section-title">Track record</h2>
          <span className="life-section-sub">The Historical block of the journal, one entry per month</span>
        </div>
        {focus.history.length === 0 ? (
          <p className="text-sm text-muted">No Historical block found in the journal.</p>
        ) : (
          <Card className="life-history">
            {focus.history.map((s, i) => {
              const t = tally(s.lines);
              return (
                <details key={`${s.title}-${i}`} open={i === 0}>
                  <summary>
                    <span>{s.title}</span>
                    {(t.hit > 0 || t.missed > 0) && (
                      <span className="life-tally">
                        <b>{t.hit} hit</b>
                        <i>{t.missed} missed</i>
                      </span>
                    )}
                  </summary>
                  <Markdown lines={s.lines} />
                </details>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
