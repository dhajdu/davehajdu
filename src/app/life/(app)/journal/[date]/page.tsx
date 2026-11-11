import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader, buttonClass } from '@/components/life/ui';
import { Markdown } from '@/components/life/Markdown';
import { AutoSaveForm } from '@/components/life/journal/AutoSaveForm';
import { DoneList, TodoList } from '@/components/life/journal/TodoList';
import { Foundation } from '@/components/life/health/Foundation';
import { TRACKS, getLongGoals } from '@/lib/life/focus';
import { EMPTY_FIELDS, dayFields, doneCount, getDay, getDayNumber, getPinnedReferences, getTodos, isDateKey, nextDay, parseRoutine, prevDay } from '@/lib/life/journal';
import { fieldsFromMarkdown } from '@/lib/life/focus-parse';
import { BLOOD_SUGAR, WEIGHT, ZONE_WORD, fmtHours, getHealth, zone } from '@/lib/life/health';
import { getLabs } from '@/lib/life/labs';
import { addDays, daysBetween, formatDate, ictToday, periodEnd, periodStart, weekOfMonth, weekStart } from '@/lib/life/metrics';
import { saveDay } from './actions';

export const metadata: Metadata = { title: 'Journal', robots: { index: false, follow: false } };

// Today is about today, in four rows: the foundation; the one thing beside
// this week's commitments; gratitude beside no holds barred; then the little
// things, to do beside done. The longer horizons live on The One Thing.
export default async function JournalDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isDateKey(date)) notFound();
  const { supabase } = await requireOwner();
  const today = ictToday();
  if (date > today) notFound();
  const week = weekStart(date);
  const month = date.slice(0, 7);

  const [entry, dayNo, todos, weightRes, sugarRes, goals, refs, health, labs, doneRes] = await Promise.all([
    getDay(supabase, date),
    getDayNumber(supabase, date),
    getTodos(supabase, date),
    supabase.from('measurements').select('value, metrics!inner(slug)').eq('metrics.slug', WEIGHT).eq('measured_on', date).maybeSingle(),
    supabase.from('measurements').select('value, metrics!inner(slug)').eq('metrics.slug', BLOOD_SUGAR).eq('measured_on', date).maybeSingle(),
    getLongGoals(supabase, undefined, week),
    getPinnedReferences(supabase),
    getHealth(supabase, today, 30),
    getLabs(supabase),
    supabase.from('todos').select('done_on').gte('done_on', periodStart(month)).lte('done_on', periodEnd(month)),
  ]);
  const weight = (weightRes.data as { value: number | string } | null)?.value;
  const sugar = (sugarRes.data as { value: number | string } | null)?.value;
  const weightTarget = goals.find((x) => x.metric?.slug === WEIGHT && x.target_value !== null && x.status === 'open')?.target_value;
  const hba1c = labs.readings.find((r) => r.metric.slug === 'hba1c') ?? null;
  const hba1cTarget = goals.find((x) => x.metric?.slug === 'hba1c' && x.target_value !== null && x.status === 'open')?.target_value;
  const fromNotion = !!entry && !entry.fields;
  const f = dayFields(entry?.fields ?? (entry ? fieldsFromMarkdown(entry.body_md) : EMPTY_FIELDS));
  const g = [f.gratitude[0] ?? '', f.gratitude[1] ?? '', f.gratitude[2] ?? ''];
  const long = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

  const rec = health.stats.recovery.last;
  const sleep = health.stats.sleep.last;
  const hrv = health.stats.hrv.last;
  const weekGoals = goals.filter((x) => x.horizon === 'week' && x.period === week);
  const daysLeft = week === weekStart(today) ? daysBetween(today, addDays(week, 6)) : null;

  // Things finished on each day of this month, for the bars beside the heading.
  const perDay = new Map<string, number>();
  for (const r of (doneRes.data ?? []) as { done_on: string }[]) perDay.set(r.done_on, (perDay.get(r.done_on) ?? 0) + 1);
  const monthDays = Array.from({ length: daysBetween(periodStart(month), periodEnd(month)) + 1 }, (_, i) => addDays(periodStart(month), i));
  const most = Math.max(1, ...perDay.values());
  const monthTotal = [...perDay.values()].reduce((a, b) => a + b, 0);
  const routine = refs.find((r) => r.key === 'routine');
  const steps = routine ? parseRoutine(routine.lines) : [];

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow={date === today ? 'Today' : formatDate(date, { weekday: 'short' })}
        title={long}
        subtitle={dayNo ? `Day ${dayNo} of the routine` : undefined}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/life/journal/${prevDay(date)}`} className={buttonClass} aria-label="Previous day">‹</Link>
            {date !== today && <Link href="/life/journal" className={buttonClass}>Today</Link>}
            {nextDay(date) <= today && <Link href={`/life/journal/${nextDay(date)}`} className={buttonClass} aria-label="Next day">›</Link>}
          </div>
        }
      />

      <AutoSaveForm action={saveDay} className="life-today">
        <input type="hidden" name="date" value={date} />

        <div className="life-card life-today-top">
          <details className="life-today-found">
            <summary>
              {rec ? (
                <span className={`life-zone is-${zone(rec.value)}`}>
                  {Math.round(rec.value)}% recovery · {ZONE_WORD[zone(rec.value)]}
                </span>
              ) : (
                <span>No recovery yet</span>
              )}
              {sleep && <span>Sleep <b>{fmtHours(sleep.value)}</b></span>}
              {hrv && <span>HRV <b>{Math.round(hrv.value)}</b></span>}
              <span className="life-today-more">The foundation</span>
            </summary>
            <Foundation
              health={health}
              today={today}
              weightTarget={weightTarget === undefined || weightTarget === null ? null : Number(weightTarget)}
              hba1c={hba1c}
              hba1cTarget={hba1cTarget === undefined || hba1cTarget === null ? null : Number(hba1cTarget)}
            />
          </details>
          <div className="life-today-stats">
            <label className="life-today-stat">
              Weight
              <input name="weight" type="number" step="0.1" inputMode="decimal" min={30} max={250} defaultValue={weight === undefined ? '' : Number(weight)} placeholder="kg" />
            </label>
            <label className="life-today-stat">
              Blood sugar
              <input name="blood_sugar" type="number" step="1" inputMode="numeric" min={20} max={600} defaultValue={sugar === undefined ? '' : Number(sugar)} placeholder="mg/dL" />
            </label>
          </div>
        </div>

        <div className="life-today-two">
          <section className="life-card">
            <h2 className="life-card-title">The one thing {date === today ? 'today' : 'that day'}</h2>
            <label className="life-journal-thing is-health">
              <span>Health</span>
              <input name="one_thing_health" defaultValue={f.one_thing_health} maxLength={300} placeholder="The one thing for my health today" className="life-journal-one" autoComplete="off" />
            </label>
            <label className="life-journal-thing is-business">
              <span>Business</span>
              <input name="one_thing" defaultValue={f.one_thing} maxLength={300} placeholder="The one thing that makes everything else easier" className="life-journal-one" autoComplete="off" />
            </label>
          </section>

          <section className="life-card life-today-week">
            <h2 className="life-card-title life-today-head">
              {date === today ? 'This week' : `Week ${weekOfMonth(week)}`}
              <small>
                {daysLeft === null ? `${formatDate(week, { month: 'short', day: 'numeric' })} to ${formatDate(addDays(week, 6), { month: 'short', day: 'numeric' })}` : daysLeft === 0 ? 'Last day' : `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`}
              </small>
            </h2>
            {TRACKS.map((t) => {
              const rows = weekGoals.filter((x) => x.track === t.key);
              return (
                <div key={t.key} className="life-today-commit">
                  <span>{t.label}</span>
                  {rows.length ? rows.map((x) => <p key={x.id} className={`is-${x.status}`}>{x.title}</p>) : <p className="is-empty">Not set yet</p>}
                </div>
              );
            })}
            <Link href="/life" className="text-xs font-semibold text-blue mt-auto">Set or adjust on The One Thing</Link>
          </section>
        </div>

        <div className="life-today-two">
          <section className="life-card">
            <h2 className="life-card-title">Morning gratitude</h2>
            <div className="life-journal-grat">
              {g.map((v, i) => (
                <label key={i} className="life-journal-grat-row">
                  <span>{i + 1}</span>
                  <input name={`g${i + 1}`} defaultValue={v} maxLength={500} placeholder={['I am grateful for…', 'I am looking forward to…', 'I feel good about…'][i]} autoComplete="off" />
                </label>
              ))}
            </div>
          </section>

          <section className="life-card">
            <h2 className="life-card-title"><label htmlFor="nhb">No holds barred</label></h2>
            <textarea id="nhb" name="nhb" defaultValue={f.nhb} placeholder="What is actually on your mind" className="life-today-nhb" />
          </section>
        </div>
      </AutoSaveForm>

      {fromNotion && (
        <p className="text-xs text-muted">This day came from Notion. Changing a field keeps your own copy here; the synced text stays below.</p>
      )}

      <div className="life-little-head">
        <h2>The little things</h2>
        <span className="life-little-month">
          <span className="life-little-bars" aria-hidden>
            {monthDays.map((d) => {
              const n = perDay.get(d) ?? 0;
              return <i key={d} className={d === date ? 'is-now' : d > today ? 'is-future' : undefined} style={{ height: n ? Math.max(4, Math.round((n / most) * 24)) : 2 }} title={`${formatDate(d, { month: 'short', day: 'numeric' })}: ${n} done`} />;
            })}
          </span>
          {monthTotal} done in {formatDate(periodStart(month), { month: 'long' })}
        </span>
      </div>
      <div className="life-today-two">
        <Card title="To do">
          <TodoList date={date} open={todos.open} />
        </Card>
        <section className="life-card">
          <h2 className="life-card-title">
            Done <span className="life-little-done">{doneCount(todos.done, date)}</span>
          </h2>
          <DoneList date={date} done={todos.done} />
        </section>
      </div>

      <div className="mt-5 space-y-3">
        {routine && (
          <details className="life-card">
            <summary className="cursor-pointer text-xs font-semibold text-blue">{routine.title}</summary>
            <div className="mt-3">
              {steps.length ? (
                <ol className="life-routine">
                  {steps.map((st, i) => (
                    <li key={i}>
                      <span className="life-routine-time">{st.time}</span>
                      <span className="life-routine-what">{st.activity}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <Markdown lines={routine.lines} />
              )}
            </div>
          </details>
        )}
        {fromNotion && entry && entry.body_md.trim() && (
          <details className="life-card">
            <summary className="cursor-pointer text-xs font-semibold text-blue">As synced from Notion</summary>
            <div className="mt-3">
              <Markdown lines={entry.body_md.split('\n')} />
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
