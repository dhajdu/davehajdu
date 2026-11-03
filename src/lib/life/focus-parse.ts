// Pure parsers for the daily journal template (Notion → entries.body_md).
// The template carries three numbered blocks, in varying order:
//   # ❶ The One Thing        **Today**: ...
//   # ❷ Multi-Delegate       (ignored here)
//   # ❸ {Month}              numbered month goals, **Week N:** lines,
//                            **Deals that should close**, **{Month} Moves**
// plus "# The Most Important things to finish in {Month}" with a DOING list.
// Statuses come from the ✅ ❌ 🟡 marks Dave types next to each line.

export type Status = 'hit' | 'missed' | 'partial' | 'open';

export type Marked = { text: string; status: Status };
export type WeekGoal = Marked & { week: number };
export type Deal = Marked & { name: string; amount: string | null };

export type MonthBlock = {
  month: string;
  goals: Marked[];
  weeks: WeekGoal[];
  deals: Deal[];
  moves: Marked[];
};

const MARKS = /[✅❌🟡]/gu;

export function statusOf(line: string): Status {
  const hit = line.includes('✅');
  const missed = line.includes('❌');
  if (hit && missed) return 'partial';
  if (hit) return 'hit';
  if (missed) return 'missed';
  if (line.includes('🟡')) return 'partial';
  return 'open';
}

// Strips status marks, bold markers and stray spacing from a template line.
// Lone surrogate halves are not valid JSON; a safety net for odd source text.
const LONE_SURROGATE = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/g;

export function clean(line: string): string {
  return line
    .replace(LONE_SURROGATE, '')
    .replace(MARKS, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*-\s*\[[ x]\]\s*/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.:])/g, '$1')
    .trim();
}

function marked(line: string): Marked {
  return { text: clean(line), status: statusOf(line) };
}

// The two One Things under the heading, wherever it sits: "**Today**: …" is
// the business one (the Notion template's only line), "**Health**: …" the
// health one written in the app.
export type OneThings = { business: string | null; health: string | null };

export function parseOneThings(md: string): OneThings {
  const m = md.match(/^#+\s*[❶❷❸]?\s*\**\s*The One Thing\s*\**\s*$([\s\S]*?)(?=^#\s|\s*$(?![\s\S]))/im);
  if (!m) return { business: null, health: null };
  const pick = (label: string) => {
    const hit = m[1].match(new RegExp(`\\*\\*${label}\\*\\*\\s*:\\s*(.+)`, 'i'));
    const text = hit ? clean(hit[1]) : null;
    return text && text.length > 0 ? text : null;
  };
  return { business: pick('Today'), health: pick('Health') };
}

export function parseOneThing(md: string): string | null {
  return parseOneThings(md).business;
}

// "Day 231 - Cambodia Holiday" → 231
export function parseRoutineDay(title: string | null | undefined): number | null {
  const m = title?.match(/\bDay\s+(\d+)\b/i);
  return m ? Number(m[1]) : null;
}

// The "# ❸ October" block, up to the next level-1 heading.
export function parseMonthBlock(md: string): MonthBlock | null {
  const head = md.match(/^#\s*❸\s*([^\n]+?)\s*$/m);
  if (!head || head.index === undefined) return null;
  const start = head.index + head[0].length;
  const rest = md.slice(start);
  const next = rest.search(/^#\s/m);
  const block = next === -1 ? rest : rest.slice(0, next);
  const lines = block.split('\n').map((l) => l.trimEnd());

  const out: MonthBlock = { month: clean(head[1]), goals: [], weeks: [], deals: [], moves: [] };
  let section: 'top' | 'deals' | 'moves' = 'top';

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (/^\*\*Deals that should close\*\*/i.test(line)) { section = 'deals'; continue; }
    if (/^\*\*[A-Za-z]+\s+Moves\*\*/i.test(line)) { section = 'moves'; continue; }

    const week = line.match(/^\*\*Week\s*(\d+)\s*:\s*\*\*(.*)$/i) ?? line.match(/^\*\*Week\s*(\d+)\s*:(.*)\*\*(.*)$/i);
    if (week) {
      const text = week.length === 4 ? `${week[2]}${week[3]}` : week[2];
      out.weeks.push({ week: Number(week[1]), ...marked(text) });
      section = 'top';
      continue;
    }

    if (section === 'top') {
      const num = line.match(/^\d+\.\s+(.*)$/);
      if (num) out.goals.push(marked(num[1]));
      continue;
    }
    if (section === 'deals') {
      const text = clean(line);
      if (!text) continue;
      const m = text.match(/^(.+?)\s*-\s*(.*)$/);
      const name = m ? m[1].trim() : text;
      const tail = m ? m[2].trim() : '';
      const amount = tail.match(/\$[\d,]+(?:\.\d+)?k?/i)?.[0] ?? null;
      out.deals.push({ name, amount, text: tail, status: statusOf(line) });
      continue;
    }
    if (section === 'moves') {
      if (/^-\s*\[[ x]\]/i.test(line)) {
        const done = /^-\s*\[x\]/i.test(line);
        const s = statusOf(line);
        out.moves.push({ text: clean(line), status: s === 'open' ? (done ? 'hit' : 'open') : s });
      }
    }
  }
  return out;
}

// "# The Most Important things to finish in October" → DOING checklist (open items).
export function parseDoing(md: string): string[] {
  const m = md.match(/^#\s*The Most Important things to finish in\s+[^\n]+$([\s\S]*?)(?=^#\s|^###\s+(?!DOING)|\s*$(?![\s\S]))/im);
  if (!m) return [];
  return m[1]
    .split('\n')
    .filter((l) => /^\s*-\s*\[ \]/.test(l))
    .map((l) => clean(l))
    .filter(Boolean);
}

// The "Historical" reference block: one section per "### Month" heading.
export type HistorySection = { title: string; lines: string[] };

export function parseHistory(md: string): HistorySection[] {
  const sections: HistorySection[] = [];
  for (const raw of md.split('\n')) {
    const h = raw.match(/^###\s+(.+?)\s*$/);
    if (h) {
      sections.push({ title: clean(h[1]), lines: [] });
      continue;
    }
    if (/^#\s/.test(raw)) continue; // the "# Historical" title
    if (!sections.length) continue;
    const t = raw.trimEnd();
    if (t.trim()) sections[sections.length - 1].lines.push(t);
  }
  return sections;
}

// ===== The to-do lists under "# The Most Important things to finish in {Month}" =====
// DOING: open items (two levels). Then dated groups, "- [x] 22nd" with the
// day's done items underneath, in the month named by the "### {Month}"
// heading (or the H1's month).

export type TodoItem = { title: string; children: string[] };
export type DoneGroup = { date: string; items: TodoItem[] };
export type TodoBlocks = { doing: TodoItem[]; done: DoneGroup[] };

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function monthIndex(name: string): number {
  const n = name.trim().toLowerCase().replace(/['’].*$/, '').trim();
  return MONTHS.findIndex((m) => m.startsWith(n.slice(0, 3)));
}

function checkbox(line: string): { indent: number; checked: boolean; text: string } | null {
  const m = line.match(/^(\s*)-\s*\[([ xX])\]\s*(.*)$/);
  if (!m) return null;
  return { indent: m[1].replace(/\t/g, '  ').length, checked: m[2] !== ' ', text: clean(m[3]) };
}

// "22nd", "17", "16th to 19th - Ignite", "8th and 9th" → the first day number.
function dayOf(text: string): number | null {
  const m = text.match(/^(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (!m) return null;
  const d = Number(m[1]);
  return d >= 1 && d <= 31 ? d : null;
}

function dateFor(entryDate: string, monthIdx: number, day: number): string {
  let year = Number(entryDate.slice(0, 4));
  const entryMonth = Number(entryDate.slice(5, 7)) - 1;
  if (monthIdx > entryMonth + 1) year -= 1; // a December log read in January
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Nested checkbox lines → two levels: tops and their children (deeper lines flatten to children).
function nest(lines: { indent: number; text: string }[]): TodoItem[] {
  const out: TodoItem[] = [];
  const base = lines.length ? Math.min(...lines.map((l) => l.indent)) : 0;
  for (const l of lines) {
    if (!l.text) continue;
    if (l.indent <= base || out.length === 0) out.push({ title: l.text, children: [] });
    else out[out.length - 1].children.push(l.text);
  }
  return out;
}

export function parseTodoBlocks(md: string, entryDate: string): TodoBlocks {
  const empty: TodoBlocks = { doing: [], done: [] };
  const head = md.match(/^#\s*The Most Important things to finish in\s+([^\n]+?)\s*$/im);
  if (!head || head.index === undefined) return empty;
  const h1Month = monthIndex(head[1]);
  const rest = md.slice(head.index + head[0].length);
  const next = rest.search(/^#\s/m);
  const block = (next === -1 ? rest : rest.slice(0, next)).split('\n');

  const doingLines: { indent: number; text: string }[] = [];
  const done: DoneGroup[] = [];
  let section: 'doing' | 'done' = 'doing';
  let monthIdx = h1Month;
  let group: { date: string; lines: { indent: number; text: string }[]; indent: number } | null = null;
  const closeGroup = () => {
    if (group) done.push({ date: group.date, items: nest(group.lines) });
    group = null;
  };

  for (const raw of block) {
    const h = raw.match(/^#{2,4}\s+(.+?)\s*$/);
    if (h) {
      const t = h[1].trim();
      if (/^doing$/i.test(t)) { section = 'doing'; continue; }
      const mi = monthIndex(t);
      if (/^done$/i.test(t) || mi !== -1) {
        closeGroup();
        section = 'done';
        if (mi !== -1) monthIdx = mi;
      }
      continue;
    }
    const cb = checkbox(raw);
    if (!cb) continue;
    if (section === 'doing') {
      doingLines.push({ indent: cb.indent, text: cb.text });
      continue;
    }
    const day = dayOf(cb.text);
    if (day !== null && (group === null || cb.indent <= group.indent) && monthIdx !== -1) {
      closeGroup();
      group = { date: dateFor(entryDate, monthIdx, day), lines: [], indent: cb.indent };
      continue;
    }
    if (group && cb.checked) group.lines.push({ indent: cb.indent, text: cb.text });
  }
  closeGroup();
  // Only unchecked lines are open; a checked line in DOING is done on the entry's day.
  const doing = nest(doingLines);
  return { doing, done };
}

export function todoKey(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}


// The three written fields of a Notion-synced day, for prefilling the journal form.
export function fieldsFromMarkdown(md: string): { one_thing: string; one_thing_health: string; gratitude: string[]; nhb: string } {
  const lines = md.split('\n');
  const gratitude: string[] = [];
  let nhb: string[] = [];
  let mode: 'none' | 'grat' | 'nhb' = 'none';
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,4}\s/.test(line) || /^\*\*General Journal/i.test(line)) {
      mode = /morning gratitude/i.test(line) ? 'grat' : /general journal/i.test(line) ? 'nhb' : 'none';
      continue;
    }
    if (mode === 'grat') {
      const m = line.match(/^[-*]\s+(.*)$/);
      if (m && gratitude.length < 3) gratitude.push(clean(m[1]));
    } else if (mode === 'nhb' && line) {
      nhb.push(line.replace(/^[-*]\s+/, ''));
    }
  }
  nhb = nhb.filter(Boolean);
  while (gratitude.length < 3) gratitude.push('');
  const things = parseOneThings(md);
  return { one_thing: things.business ?? '', one_thing_health: things.health ?? '', gratitude, nhb: nhb.join('\n') };
}
