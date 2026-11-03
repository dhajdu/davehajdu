import type { GoalRow } from './focus';
import { statusOf, type HistorySection } from './focus-parse';
import type { MonthReview } from './month-review';

// The track record, one entry per past month: the app's month and week goals,
// the journal's Historical lines for that month, and the month-end review's
// grades, with one tally across all of it.
export type Tally = { hit: number; partial: number; missed: number; open: number };

export type MonthRecord = {
  period: string; // YYYY-MM
  goals: GoalRow[]; // month goals, the One Thing first
  weekGoals: GoalRow[];
  lines: string[]; // the journal's Historical block for the month
  review: MonthReview | null;
  tally: Tally;
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

// "September" → the most recent September before `period` (within a year).
export function periodForMonthName(name: string, period: string): string | null {
  const idx = MONTHS.indexOf(name.trim().toLowerCase().split(/\s+/)[0]);
  if (idx === -1) return null;
  let y = Number(period.slice(0, 4));
  let m = Number(period.slice(5, 7)) - 1;
  for (let i = 0; i < 12; i++) {
    m -= 1;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m === idx) return `${y}-${String(m + 1).padStart(2, '0')}`;
  }
  return null;
}

export function tallyOf(goals: GoalRow[], lines: string[]): Tally {
  const t: Tally = { hit: 0, partial: 0, missed: 0, open: 0 };
  for (const g of goals) {
    if (g.status === 'hit') t.hit++;
    else if (g.status === 'missed') t.missed++;
    else if (g.status === 'behind') t.partial++;
    else t.open++;
  }
  for (const line of lines) {
    const s = statusOf(line);
    if (s === 'hit') t.hit++;
    else if (s === 'missed') t.missed++;
    else if (s === 'partial') t.partial++;
  }
  return t;
}

// Share of the marked items that landed, 0 to 1, or null when nothing was marked.
export function hitRate(t: Tally): number | null {
  const marked = t.hit + t.partial + t.missed;
  return marked ? (t.hit + t.partial / 2) / marked : null;
}

export function buildRecord(pastGoals: GoalRow[], history: HistorySection[], reviews: MonthReview[], period: string): MonthRecord[] {
  const byPeriod = new Map<string, MonthRecord>();
  const get = (p: string) => {
    let r = byPeriod.get(p);
    if (!r) {
      r = { period: p, goals: [], weekGoals: [], lines: [], review: null, tally: { hit: 0, partial: 0, missed: 0, open: 0 } };
      byPeriod.set(p, r);
    }
    return r;
  };
  for (const g of pastGoals) {
    if (!g.period) continue;
    const p = g.horizon === 'week' ? g.period.slice(0, 7) : g.period;
    (g.horizon === 'week' ? get(p).weekGoals : get(p).goals).push(g);
  }
  for (const s of history) {
    const p = periodForMonthName(s.title, period);
    if (p) get(p).lines.push(...s.lines);
  }
  for (const r of reviews) if (r.period < period) get(r.period).review = r;

  const out = [...byPeriod.values()].filter((r) => r.period < period);
  for (const r of out) r.tally = tallyOf([...r.goals, ...r.weekGoals], r.lines);
  return out.sort((a, b) => (a.period < b.period ? 1 : -1));
}
