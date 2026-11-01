// Title date parsing. The title wins over the page's created time; the created
// time supplies a missing year and is the fallback when the title has no date.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const MONTH_RE = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\\.?';
const DAY_RE = '(\\d{1,2})(?:st|nd|rd|th)?';
const YEAR_RE = "(?:,?\\s*(\\d{4})|\\s+'(\\d{2}))?";

const MONTH_DAY = new RegExp(`\\b${MONTH_RE}\\s+${DAY_RE}\\b${YEAR_RE}`, 'i');
const DAY_MONTH = new RegExp(`\\b${DAY_RE}\\s+${MONTH_RE}\\b${YEAR_RE}`, 'i');
const ISO = /\b(\d{4})-(\d{2})-(\d{2})\b/;
const NUMERIC = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2}|\d{4}))?\b/;
const ANY_YEAR = /\b(19\d{2}|20\d{2})\b/;

const DAY_MS = 86_400_000;
const ICT_OFFSET_MS = 7 * 3_600_000; // Dave lives in Vietnam; dates are local days

export interface ParsedDate {
  date: string; // YYYY-MM-DD used for the row
  source: 'title' | 'created';
  createdDate: string; // created time as an ICT day
  yearExplicit: boolean;
  yearAnomaly: boolean; // explicit title year far from the created year (e.g. 2028)
  literalDate?: string; // the title date taken literally, when yearAnomaly
  mismatchDays: number; // |date - createdDate|
  mismatch: boolean; // > 45 days
}

export function ictDay(iso: string): string {
  return new Date(new Date(iso).getTime() + ICT_OFFSET_MS).toISOString().slice(0, 10);
}

function ymd(y: number, m: number, d: number): string | null {
  const t = Date.UTC(y, m - 1, d);
  const dt = new Date(t);
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  return Math.round(Math.abs(Date.parse(a) - Date.parse(b)) / DAY_MS);
}

function monthNum(s: string): number {
  return MONTHS[s.toLowerCase().slice(0, 3)];
}

// Finds the first month/day (and year, if present) in a title.
export function findTitleDate(title: string): { month: number; day: number; year?: number } | null {
  const iso = title.match(ISO);
  const md = title.match(MONTH_DAY);
  const dm = title.match(DAY_MONTH);
  const num = title.match(NUMERIC);
  const candidates: { index: number; month: number; day: number; year?: number }[] = [];
  if (iso) candidates.push({ index: iso.index!, year: +iso[1], month: +iso[2], day: +iso[3] });
  if (md) {
    const y = md[3] ? +md[3] : md[4] ? 2000 + +md[4] : undefined;
    candidates.push({ index: md.index!, month: monthNum(md[1]), day: +md[2], year: y });
  }
  if (dm) {
    const y = dm[3] ? +dm[3] : dm[4] ? 2000 + +dm[4] : undefined;
    candidates.push({ index: dm.index!, month: monthNum(dm[2]), day: +dm[1], year: y });
  }
  if (num && !iso) {
    const y = num[3] ? (num[3].length === 2 ? 2000 + +num[3] : +num[3]) : undefined;
    candidates.push({ index: num.index!, month: +num[1], day: +num[2], year: y });
  }
  const valid = candidates.filter((c) => c.month >= 1 && c.month <= 12 && c.day >= 1 && c.day <= 31);
  if (!valid.length) return null;
  valid.sort((a, b) => a.index - b.index);
  const first = valid[0];
  // "Mar 15th + Apr 26, 2022": the first date borrows a year written later in the title.
  if (first.year === undefined) {
    const y = title.slice(first.index).match(ANY_YEAR);
    if (y) first.year = +y[1];
  }
  return { month: first.month, day: first.day, year: first.year };
}

// `trustYear`: an explicit title year always wins (used for learnings, whose
// fallback is the host page's date rather than a created time).
export function parseTitleDate(title: string, createdIso: string, opts: { mismatchLimitDays?: number; trustYear?: boolean } = {}): ParsedDate {
  const mismatchLimitDays = opts.mismatchLimitDays ?? 45;
  const createdDate = /^\d{4}-\d{2}-\d{2}$/.test(createdIso) ? createdIso : ictDay(createdIso);
  const cy = +createdDate.slice(0, 4);
  const base: ParsedDate = {
    date: createdDate,
    source: 'created',
    createdDate,
    yearExplicit: false,
    yearAnomaly: false,
    mismatchDays: 0,
    mismatch: false,
  };
  const found = findTitleDate(title);
  if (!found) return base;

  // Year inferred from created time: the candidate year closest to it.
  let inferred: string | null = null;
  let best = Infinity;
  for (const y of [cy - 1, cy, cy + 1]) {
    const d = ymd(y, found.month, found.day);
    if (!d) continue;
    const diff = daysBetween(d, createdDate);
    if (diff < best) [best, inferred] = [diff, d];
  }

  let date = inferred;
  let yearAnomaly = false;
  let literalDate: string | undefined;
  if (found.year !== undefined) {
    const literal = ymd(found.year, found.month, found.day);
    if (literal && !opts.trustYear && daysBetween(literal, createdDate) > 366) {
      yearAnomaly = true;
      literalDate = literal;
    } else if (literal) {
      date = literal;
    }
  }
  if (!date) return base;
  const mismatchDays = daysBetween(date, createdDate);
  return {
    date,
    source: 'title',
    createdDate,
    yearExplicit: found.year !== undefined,
    yearAnomaly,
    literalDate,
    mismatchDays,
    mismatch: mismatchDays > mismatchLimitDays,
  };
}
