import 'server-only';
import type { Db } from './metrics';
import { VISION_TITLE, visionFields, type VisionFields } from './vision';
import {
  parseDoing,
  parseHistory,
  parseMonthBlock,
  parseOneThings,
  parseRoutineDay,
  type HistorySection,
  type MonthBlock,
} from './focus-parse';

// What Dave wrote in the journal about what matters: today's One Thing, the
// month's goals (the ❸ block) and the Historical log of past months.
export type Focus = {
  oneThing: { business: string | null; health: string | null; date: string; day: number | null } | null;
  latest: { date: string; day: number | null } | null;
  month: (MonthBlock & { date: string }) | null;
  doing: { items: string[]; date: string } | null;
  history: HistorySection[];
  vision: (VisionFields & { date: string }) | null; // the statement, the values and the picture, as written in the app
};

type Row = { entry_date: string; title: string | null; body_md: string };

export async function getFocus(db: Db, today: string): Promise<Focus> {
  const [recentRes, monthRes, histRes, visionRes] = await Promise.all([
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'journal').lte('entry_date', today).order('entry_date', { ascending: false }).limit(10),
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'journal').lte('entry_date', today).like('body_md', '%❸%').order('entry_date', { ascending: false }).limit(1),
    db.from('entries').select('entry_date, title, body_md').eq('kind', 'reference').ilike('title', 'historical').order('entry_date', { ascending: false }).limit(1),
    db.from('entries').select('entry_date, fields').eq('kind', 'reference').eq('title', VISION_TITLE).not('fields', 'is', null).order('entry_date', { ascending: false }).limit(1),
  ]);
  if (recentRes.error) throw new Error(recentRes.error.message);

  const recent = (recentRes.data ?? []) as Row[];
  const latest = recent[0] ? { date: recent[0].entry_date, day: parseRoutineDay(recent[0].title) } : null;

  let oneThing: Focus['oneThing'] = null;
  let doing: Focus['doing'] = null;
  for (const e of recent) {
    if (!oneThing) {
      const things = parseOneThings(e.body_md);
      if (things.business || things.health) oneThing = { ...things, date: e.entry_date, day: parseRoutineDay(e.title) };
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

  const visionRow = (visionRes.data?.[0] ?? null) as { entry_date: string; fields: Partial<VisionFields> } | null;
  const vision = visionRow ? { ...visionFields(visionRow.fields), date: visionRow.entry_date } : null;

  return { oneThing, latest, month, doing, history, vision };
}

// The two tracks of the ladder. Health first: it is the foundation.
export type Track = 'health' | 'business';
export const TRACKS: { key: Track; label: string }[] = [
  { key: 'health', label: 'Health' },
  { key: 'business', label: 'Business' },
];

// Goals rows for the ladder: vision (five years) and year.
export type GoalRow = {
  id: string;
  title: string;
  horizon: 'vision' | 'year' | 'month' | 'week' | '30d' | '60d';
  status: 'open' | 'hit' | 'missed' | 'dropped' | 'behind';
  due_on: string | null;
  target_value: number | string | null;
  period: string | null;
  focus: boolean;
  track: Track;
  area: { slug: string; name: string } | null;
  metric: { slug: string; name: string; unit: string | null } | null;
};

const GOAL_SELECT = 'id, title, horizon, status, due_on, target_value, period, focus, track, area:areas(slug, name), metric:metrics(slug, name, unit)';

// Every month and week goal before `period`, newest first, for the track record.
export async function getPastGoals(db: Db, period: string): Promise<GoalRow[]> {
  const { data, error } = await db
    .from('goals')
    .select(GOAL_SELECT)
    .in('horizon', ['month', 'week'])
    .lt('period', period)
    .order('period', { ascending: false })
    .order('focus', { ascending: false })
    .order('created_at');
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as GoalRow[];
}

// Vision and year goals, plus the month goals of `period` and the week goals
// of `week` (its Monday, or several Mondays), the One Thing first.
export async function getLongGoals(db: Db, period?: string, week?: string | string[]): Promise<GoalRow[]> {
  let q = db.from('goals').select(GOAL_SELECT).neq('status', 'dropped').order('focus', { ascending: false }).order('created_at');
  const parts = ['horizon.in.(vision,year)'];
  if (period) parts.push(`and(horizon.eq.month,period.eq.${period})`);
  if (week?.length) parts.push(`and(horizon.eq.week,period.in.(${[week].flat().join(',')}))`);
  q = parts.length > 1 ? q.or(parts.join(',')) : q.in('horizon', ['vision', 'year']);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as GoalRow[];
}
