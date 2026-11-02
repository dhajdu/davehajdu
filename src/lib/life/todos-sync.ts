import type { SupabaseClient } from '@supabase/supabase-js';
import { parseTodoBlocks, todoKey, type TodoItem } from './focus-parse';

// Carries the journal's to-do lists into `todos`: open items from the latest
// DOING list, done items from the dated DONE groups of every entry. Items
// written in the app (source = app) are never touched. Idempotent: an item is
// matched by its normalised title (children by parent + title).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any, any, any>;

type Row = { id: string; parent_id: string | null; title: string; added_on: string; done_on: string | null; dropped_on: string | null; source: string };
type Entry = { entry_date: string; body_md: string };

export type TodoSyncReport = { entries: number; inserted: number; completed: number; dropped: number; open: number };

// `live` is the newest Notion page, whole: its DOING list is what is open now.
// Without it, the latest synced entry's list stands in (a day's new lines only).
export async function syncTodosFromJournal(db: Db, ownerId: string, sinceDate?: string, live?: { date: string; md: string } | null): Promise<TodoSyncReport> {
  let q = db.from('entries').select('entry_date, body_md').eq('owner_id', ownerId).eq('kind', 'journal').not('external_id', 'is', null).order('entry_date');
  if (sinceDate) q = q.gte('entry_date', sinceDate);
  const { data: entryRows, error } = await q;
  if (error) throw new Error(error.message);
  const entries = (entryRows ?? []) as Entry[];
  if (entries.length === 0) return { entries: 0, inserted: 0, completed: 0, dropped: 0, open: 0 };

  const { data: todoRows, error: tErr } = await db.from('todos').select('id, parent_id, title, added_on, done_on, dropped_on, source').eq('owner_id', ownerId);
  if (tErr) throw new Error(tErr.message);
  const rows = (todoRows ?? []) as Row[];
  const byId = new Map(rows.map((r) => [r.id, r]));
  const keyOf = (r: Row) => (r.parent_id ? `${todoKey(byId.get(r.parent_id)?.title ?? '')}>${todoKey(r.title)}` : todoKey(r.title));
  const byKey = new Map<string, Row>();
  for (const r of rows) byKey.set(keyOf(r), r);

  const report: TodoSyncReport = { entries: entries.length, inserted: 0, completed: 0, dropped: 0, open: 0 };
  let order = rows.length;

  const insert = async (title: string, parent: string | null, added: string, done: string | null): Promise<Row> => {
    const { data, error: e } = await db
      .from('todos')
      .insert({ owner_id: ownerId, parent_id: parent, title, added_on: added, done_on: done, sort_order: order++, source: 'notion' })
      .select('id, parent_id, title, added_on, done_on, dropped_on, source')
      .single();
    if (e) throw new Error(`${e.message} (inserting "${title}" added ${added}${done ? ` done ${done}` : ''})`);
    report.inserted++;
    const r = data as Row;
    byId.set(r.id, r);
    byKey.set(keyOf(r), r);
    return r;
  };
  const complete = async (r: Row, date: string) => {
    if (r.source !== 'notion' || r.done_on) return;
    const { error: e } = await db.from('todos').update({ done_on: date, dropped_on: null }).eq('id', r.id);
    if (e) throw new Error(e.message);
    r.done_on = date;
    r.dropped_on = null;
    report.completed++;
  };

  // Walks a two-level list: `place` decides what to do with each found or missing row.
  const walk = async (items: TodoItem[], date: string, done: boolean) => {
    for (const it of items) {
      const k = todoKey(it.title);
      if (!k) continue;
      let top = byKey.get(k);
      if (!top) top = await insert(it.title, null, date, done ? date : null);
      else if (done) await complete(top, date);
      for (const c of it.children) {
        const ck = `${k}>${todoKey(c)}`;
        if (!todoKey(c)) continue;
        const child = byKey.get(ck);
        if (!child) await insert(c, top.id, date, done ? date : null);
        else if (done) await complete(child, date);
      }
    }
  };

  const seenDone = new Set<string>();
  for (const e of entries) {
    const blocks = parseTodoBlocks(e.body_md, e.entry_date);
    for (const g of blocks.done) {
      // The month's log is carried forward in every entry; each day's list is read once.
      const stamp = `${g.date}|${g.items.map((i) => i.title).join('|')}`;
      if (seenDone.has(stamp)) continue;
      seenDone.add(stamp);
      await walk(g.items, g.date, true);
    }
    await walk(blocks.doing, e.entry_date, false);
  }

  // What the latest entry still lists as DOING is open; other Notion items that
  // are open but absent were finished or deleted in Notion without a DONE line.
  const latest = live ?? { date: entries[entries.length - 1].entry_date, md: entries[entries.length - 1].body_md };
  const liveBlocks = parseTodoBlocks(latest.md, latest.date);
  if (live) {
    for (const g of liveBlocks.done) await walk(g.items, g.date, true);
    await walk(liveBlocks.doing, latest.date, false);
  }
  const latestDoing = liveBlocks.doing;
  const openKeys = new Set<string>();
  for (const it of latestDoing) {
    const k = todoKey(it.title);
    openKeys.add(k);
    for (const c of it.children) openKeys.add(`${k}>${todoKey(c)}`);
  }
  for (const r of byKey.values()) {
    if (r.source !== 'notion' || r.done_on || r.dropped_on) continue;
    const k = keyOf(r);
    const parentOpen = r.parent_id ? openKeys.has(todoKey(byId.get(r.parent_id)?.title ?? '')) : false;
    if (openKeys.has(k) || parentOpen) {
      report.open++;
      continue;
    }
    if (r.added_on >= latest.date) {
      report.open++;
      continue;
    }
    const { error: e } = await db.from('todos').update({ dropped_on: latest.date }).eq('id', r.id);
    if (e) throw new Error(e.message);
    report.dropped++;
  }
  return report;
}
