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

const MARKS = /[✅❌🟡]/g;

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
export function clean(line: string): string {
  return line
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

// "**Today**: Workout and Rentwest" under the One Thing heading, wherever it sits.
export function parseOneThing(md: string): string | null {
  const m = md.match(/^#+\s*[❶❷❸]?\s*\**\s*The One Thing\s*\**\s*$([\s\S]*?)(?=^#\s|\s*$(?![\s\S]))/im);
  if (!m) return null;
  const today = m[1].match(/\*\*Today\*\*\s*:\s*(.+)/i);
  const text = today ? clean(today[1]) : null;
  return text && text.length > 0 ? text : null;
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
