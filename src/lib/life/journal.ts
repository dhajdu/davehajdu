import 'server-only';
import { addDays, daysBetween, type Db } from './metrics';
import { parseRoutineDay } from './focus-parse';

// The journal, written in the app. A day is four things: the One Thing,
// three gratitudes, No Holds Barred, and the to-do list. The first three are
// stored as `entries.fields` and rendered to body_md in the same shape as
// the Notion template, so the ladder, search and Ask read one format.
// one_thing is the business One Thing (the Notion template's "Today" line); one_thing_health the health one.
export type DayFields = { one_thing: string; one_thing_health: string; gratitude: string[]; nhb: string };

export type JournalEntry = {
  id: string;
  entry_date: string;
  title: string | null;
  body_md: string;
  external_id: string | null;
  fields: DayFields | null;
};

export type Todo = {
  id: string;
  parent_id: string | null;
  title: string;
  added_on: string;
  done_on: string | null;
  dropped_on: string | null;
  planned_on: string | null; // the day it is meant to get done (above the line); null means another day
  sort_order: number;
};

export type TodoNode = Todo & { children: Todo[] };

// Items and sub-items ticked off on `date`.
export const doneCount = (done: TodoNode[], date: string) => done.reduce((n, d) => n + (d.done_on === date ? 1 : 0) + d.children.length, 0);

export const EMPTY_FIELDS: DayFields = { one_thing: '', one_thing_health: '', gratitude: ['', '', ''], nhb: '' };

// Rows written before the health line exist without it.
export function dayFields(stored: Partial<DayFields> | null | undefined): DayFields {
  return { ...EMPTY_FIELDS, ...(stored ?? {}) };
}

export function renderDay(f: DayFields): string {
  const lines: string[] = ['### **Morning Gratitude **🙏🏽', ''];
  for (const g of f.gratitude.map((s) => s.trim()).filter(Boolean)) lines.push(`- ${g}`);
  lines.push('');
  if (f.nhb.trim()) lines.push('**General Journal: No Holds Barred**', '', f.nhb.trim(), '');
  lines.push('#  ❶ **The One Thing**', '', `**Today**: ${f.one_thing.trim()}`);
  if (f.one_thing_health.trim()) lines.push(`**Health**: ${f.one_thing_health.trim()}`);
  lines.push('');
  return lines.join('\n');
}

export function dayTitle(dayNo: number | null, f: DayFields): string {
  const head = dayNo ? `Day ${dayNo}` : 'Journal';
  const thing = f.one_thing.trim() || f.one_thing_health.trim();
  return thing ? `${head} - ${thing}` : head;
}

export function isDateKey(s: unknown): s is string {
  return typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

// Day N of the routine: the latest titled day on or before `date`, carried forward.
export async function getDayNumber(db: Db, date: string): Promise<number | null> {
  const { data } = await db
    .from('entries')
    .select('entry_date, title')
    .eq('kind', 'journal')
    .lte('entry_date', date)
    .ilike('title', 'Day %')
    .order('entry_date', { ascending: false })
    .limit(1);
  const row = data?.[0] as { entry_date: string; title: string } | undefined;
  if (!row) return null;
  const n = parseRoutineDay(row.title);
  return n === null ? null : n + daysBetween(row.entry_date, date);
}

// The day's entry: the one written in the app if there is one, else the Notion one.
export async function getDay(db: Db, date: string): Promise<JournalEntry | null> {
  const { data, error } = await db
    .from('entries')
    .select('id, entry_date, title, body_md, external_id, fields')
    .eq('kind', 'journal')
    .eq('entry_date', date)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as JournalEntry[];
  return rows.find((r) => r.fields) ?? rows[0] ?? null;
}

// What was open on `date` (added by then, not yet done or dropped) and what got done that day.
export async function getTodos(db: Db, date: string): Promise<{ open: TodoNode[]; done: TodoNode[] }> {
  const { data, error } = await db
    .from('todos')
    .select('id, parent_id, title, added_on, done_on, dropped_on, planned_on, sort_order')
    .lte('added_on', date)
    .or(`done_on.is.null,done_on.gte.${date}`)
    .or(`dropped_on.is.null,dropped_on.gt.${date}`)
    .order('sort_order')
    .order('created_at');
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Todo[];
  const openOn = (t: Todo) => (t.done_on === null || t.done_on > date) && (t.dropped_on === null || t.dropped_on > date);
  const doneOn = (t: Todo) => t.done_on === date;

  const byParent = new Map<string | null, Todo[]>();
  for (const t of rows) byParent.set(t.parent_id, [...(byParent.get(t.parent_id) ?? []), t]);
  const roots = rows.filter((t) => t.parent_id === null || !rows.some((p) => p.id === t.parent_id));
  const nodes: TodoNode[] = roots.map((t) => ({ ...t, children: byParent.get(t.id) ?? [] }));

  const open = nodes
    .filter((n) => openOn(n) || n.children.some(openOn))
    .map((n) => ({ ...n, children: n.children.filter(openOn) }));
  const done = nodes
    .filter((n) => doneOn(n) || n.children.some(doneOn))
    .map((n) => ({ ...n, children: n.children.filter(doneOn) }));
  return { open, done };
}

// Reference blocks from the Notion template that stay in view while writing:
// the latest version of each, by title.
// Learnings are a separate thing (their own table, with the source), not a rail block.
export const PINNED_REFERENCES: { key: string; title: string; match: string }[] = [
  { key: 'routine', title: 'Daily routine', match: 'daily routine%' },
];

export type Reference = { key: string; title: string; entry_date: string; lines: string[] };

export async function getPinnedReferences(db: Db): Promise<Reference[]> {
  const out: Reference[] = [];
  for (const ref of PINNED_REFERENCES) {
    const { data } = await db.from('entries').select('entry_date, body_md').eq('kind', 'reference').ilike('title', ref.match).order('entry_date', { ascending: false }).limit(1);
    const row = data?.[0] as { entry_date: string; body_md: string } | undefined;
    if (!row) continue;
    // Drop the block's own heading; the rail supplies one.
    const lines = row.body_md.split('\n').filter((l, i) => !(i === 0 && /^#{1,4}\s/.test(l)));
    out.push({ key: ref.key, title: ref.title, entry_date: row.entry_date, lines });
  }
  return out;
}

// The daily routine table → time and activity, for the reminder in the rail.
export type RoutineStep = { time: string; activity: string };
export function parseRoutine(lines: string[]): RoutineStep[] {
  const out: RoutineStep[] = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|') || /^\|\s*-{2,}/.test(line)) continue;
    const cells = line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim().replace(/\*\*/g, ''));
    if (cells.length < 2) continue;
    if (/^time$/i.test(cells[0])) continue;
    const time = cells[0].replace(/\s+/g, '');
    const activity = cells[1].replace(/[✅❌🟡]/g, '').trim();
    if (!activity) continue;
    out.push({ time, activity });
  }
  return out;
}

export const prevDay = (d: string) => addDays(d, -1);
export const nextDay = (d: string) => addDays(d, 1);
