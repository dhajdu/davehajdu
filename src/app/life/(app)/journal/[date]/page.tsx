import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/life/auth';
import { Card, PageHeader, buttonClass, primaryButtonClass } from '@/components/life/ui';
import { Markdown } from '@/components/life/Markdown';
import { SaveButton } from '@/components/life/SaveButton';
import { TodoList } from '@/components/life/journal/TodoList';
import { JournalRail } from '@/components/life/journal/JournalRail';
import { getFocus, getLongGoals } from '@/lib/life/focus';
import { EMPTY_FIELDS, getDay, getDayNumber, getPinnedReferences, getTodos, isDateKey, nextDay, prevDay } from '@/lib/life/journal';
import { fieldsFromMarkdown } from '@/lib/life/focus-parse';
import { WEIGHT } from '@/lib/life/health';
import { formatDate, ictToday } from '@/lib/life/metrics';
import { saveDay } from './actions';

export const metadata: Metadata = { title: 'Journal', robots: { index: false, follow: false } };

export default async function JournalDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  if (!isDateKey(date)) notFound();
  const { supabase } = await requireOwner();
  const today = ictToday();
  if (date > today) notFound();

  const [entry, dayNo, todos, weightRes, focus, goals, refs] = await Promise.all([
    getDay(supabase, date),
    getDayNumber(supabase, date),
    getTodos(supabase, date),
    supabase.from('measurements').select('value, metrics!inner(slug)').eq('metrics.slug', WEIGHT).eq('measured_on', date).maybeSingle(),
    getFocus(supabase, today),
    getLongGoals(supabase, today.slice(0, 7)),
    getPinnedReferences(supabase),
  ]);
  const weight = (weightRes.data as { value: number | string } | null)?.value;
  const fromNotion = !!entry && !entry.fields;
  const f = entry?.fields ?? (entry ? fieldsFromMarkdown(entry.body_md) : EMPTY_FIELDS);
  const g = [f.gratitude[0] ?? '', f.gratitude[1] ?? '', f.gratitude[2] ?? ''];
  const long = new Date(`${date}T00:00:00Z`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

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

      <div className="life-journal-grid">
      <div className="space-y-5 min-w-0">
        <form action={saveDay} className="life-journal">
            <input type="hidden" name="date" value={date} />
            <section className="life-card">
              <label className="life-stat-k" htmlFor="one_thing">❶ The one thing today</label>
              <input id="one_thing" name="one_thing" defaultValue={f.one_thing} maxLength={300} placeholder="The one thing that makes everything else easier" className="life-journal-one" autoComplete="off" />
            </section>

            <section className="life-card">
              <p className="life-stat-k">Morning gratitude</p>
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
              <label className="life-stat-k" htmlFor="nhb">No holds barred</label>
              <textarea id="nhb" name="nhb" defaultValue={f.nhb} rows={6} placeholder="What is actually on your mind" className="life-journal-nhb" />
            </section>

            <div className="life-journal-foot">
              <label className="life-journal-weight">
                <span className="life-stat-k">Weight</span>
                <input name="weight" type="number" step="0.1" inputMode="decimal" min={30} max={250} defaultValue={weight === undefined ? '' : Number(weight)} placeholder="kg" />
              </label>
              <SaveButton className={primaryButtonClass}>Save the day</SaveButton>
            </div>
            {fromNotion && (
              <p className="text-xs text-muted">
                This day came from Notion. Saving keeps your own copy here; the synced text stays below.
              </p>
            )}
          </form>

        {fromNotion && entry && entry.body_md.trim() && (
          <details className="life-card">
            <summary className="cursor-pointer text-xs font-semibold text-blue">As synced from Notion</summary>
            <div className="mt-3">
              <Markdown lines={entry.body_md.split('\n')} />
            </div>
          </details>
        )}

        <Card title="To do">
          <TodoList date={date} open={todos.open} done={todos.done} />
        </Card>
      </div>
      <JournalRail focus={focus} goals={goals} refs={refs} today={today} />
      </div>
    </div>
  );
}
