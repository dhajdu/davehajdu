import 'server-only';
import type { Db } from './metrics';
import {
  parseDoing,
  parseHistory,
  parseMonthBlock,
  parseOneThing,
  parseRoutineDay,
  type HistorySection,
  type MonthBlock,
} from './focus-parse';

// What Dave wrote in the journal about what matters: today's One Thing, the
// month's goals (the ❸ block) and the Historical log of past months.
export type Focus = {
  oneThing: { text: string; date: string; day: number | null } | null;
  latest: { date: string; day: number | null } | null;
  month: (MonthBlock & { date: string }) | null;
  doing: { items: string[]; date: string } | null;
  history: HistorySection[];
};

type Row = { entry_date: string; title: string | null; body_md: string };

export async function getFocus(db: Db, today: string): Promise<Focus> {
  const [recentRes, monthRes, histRes] = await Promise.all([
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'journal').lte('entry_date', today).order('entry_date', { ascending: false }).limit(10),
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'journal').lte('entry_date', today).like('body_md', '%❸%').order('entry_date', { ascending: false }).limit(1),
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'reference').ilike('title', 'historical').order('entry_date', { ascending: false }).limit(1),
  ]);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const recent = (recentRes.data ?? []) as Row[];
  const latest = recent[0] ? { date: recent[0].entry_date, day: parseRoutineDay(recent[0].title) } : null;

  let oneThing: Focus['oneThing'] = null;
  let doing: Focus['doing'] = null;
  for (const e of recent) {
    if (!oneThing) {
      const text = parseOneThing(e.body_md);
      if (text) oneThing = { text, date: e.entry_date, day: parseRoutineDay(e.title) };
    }
    if (!doing) {
      const items = parseDoing(e.body_md);
      if (items.length) doing = { items, date: e.entry_date };
    }
    if (oneThing && doing) break;
  }

  const monthRow = (monthRes.data?.[0] ?? null) as Row | null;
  const block = monthRow ? parseMonthBlock(monthRow.body_md) : null;
  const month = block && monthRow ? { ...block, date: monthRow.entry_date } : null;

  const histRow = (histRes.data?.[0] ?? null) as Row | null;
  const history = histRow ? parseHistory(histRow.body_md).filter((s) => s.lines.length > 0) : [];

  return { oneThing, latest, month, doing, history };
}

// Goals rows for the ladder: vision (five years) and year.
export type GoalRow = {
  id: string;
  title: string;
  horizon: 'vision' | 'year' | '30d' | '60d';
  status: 'open' | 'hit' | 'missed' | 'dropped';
  due_on: string | null;
  target_value: number | string | null;
  area: { slug: string; name: string } | null;
  metric: { slug: string; name: string; unit: string | null } | null;
};

export async function getLongGoals(db: Db): Promise<GoalRow[]> {
  const { data, error } = await db
    .from('goals')
    .select('id, title, horizon, status, due_on, target_value, area:areas(slug, name), metric:metrics(slug, name, unit)')
    .in('horizon', ['vision', 'year'])
    .neq('status', 'dropped')
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as GoalRow[];
}
