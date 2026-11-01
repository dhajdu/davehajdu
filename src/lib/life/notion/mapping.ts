import type { NBlock, NPage } from './client';
import { propNumber } from './client';
import { blockPlainText, blocksToMarkdown } from './markdown';
import { parseTitleDate } from './dates';

// ---- Journal Tag → area ----

const TAG_AREA: Record<string, string> = {
  health: 'body',
  family: 'people',
  relationship: 'people',
  business: 'work',
  eo: 'work',
  finance: 'money',
  growth: 'mind',
  language: 'mind',
  chill: 'mind',
};

// First mapped tag wins; untagged or unknown tags default to mind.
export function journalArea(tags: string[]): string {
  for (const t of tags) {
    const a = TAG_AREA[t.trim().toLowerCase()];
    if (a) return a;
  }
  return 'mind';
}

// ---- EO update scores ----

export const EO_SCORE_PROPS: { prop: string; area: string }[] = [
  { prop: 'Physical Health', area: 'body' },
  { prop: 'Mental Health', area: 'mind' },
  { prop: 'Financial Health', area: 'money' },
  { prop: 'Friends/Family', area: 'people' },
  { prop: 'Professional Progress', area: 'work' },
];

export interface EoScore {
  area: string;
  prop: string;
  value: number;
  valid: boolean; // 0..10; anything else goes to the Inbox
}

export function eoScores(props: Record<string, number | null | undefined>): EoScore[] {
  const out: EoScore[] = [];
  for (const { prop, area } of EO_SCORE_PROPS) {
    const v = props[prop];
    if (typeof v !== 'number' || Number.isNaN(v)) continue;
    out.push({ area, prop, value: v, valid: v >= 0 && v <= 10 });
  }
  return out;
}

export function eoScoresFromPage(page: NPage): EoScore[] {
  return eoScores(Object.fromEntries(EO_SCORE_PROPS.map(({ prop }) => [prop, propNumber(page, prop)])));
}

export function reviewPeriod(date: string): string {
  return date.slice(0, 7);
}

// ---- Learnings splitter ----

export function slugTitle(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Learning {
  externalId: string; // learning:<normalised title>, so repeats across pages dedupe
  title: string;
  date: string;
  bodyMd: string;
}

const isHeading = (b: NBlock, n?: number) => (n ? b.type === `heading_${n}` : /^heading_[123]$/.test(b.type));

function isLearningsBlock(b: NBlock): boolean {
  return (isHeading(b) || b.type === 'toggle') && /learnings?\b/i.test(blockPlainText(b)) && !!b.children?.length;
}

// Finds the Learnings block, searching through synced blocks and columns.
// Returns it plus the index of the top-level block that contains it.
export function findLearnings(blocks: NBlock[]): { block: NBlock; topIndex: number } | null {
  const search = (list: NBlock[]): NBlock | null => {
    for (const b of list) {
      if (isLearningsBlock(b)) return b;
      if (['synced_block', 'column_list', 'column'].includes(b.type) && b.children) {
        const hit = search(b.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  for (let i = 0; i < blocks.length; i++) {
    const hit = search([blocks[i]]);
    if (hit) return { block: hit, topIndex: i };
  }
  return null;
}

// One learning per h3 under Learnings. A toggle h3 owns its children; a plain
// h3 owns the siblings up to the next h3.
export function splitLearnings(learningsBlock: NBlock, fallbackDate: string): Learning[] {
  const kids = learningsBlock.children ?? [];
  const out: Learning[] = [];
  for (let i = 0; i < kids.length; i++) {
    const b = kids[i];
    if (!isHeading(b, 3)) continue;
    const title = blockPlainText(b).trim();
    if (!title) continue;
    let body: NBlock[] = b.children ?? [];
    if (!body.length) {
      const j = kids.findIndex((k, idx) => idx > i && isHeading(k, 3));
      body = kids.slice(i + 1, j === -1 ? undefined : j);
    }
    out.push({
      externalId: `learning:${slugTitle(title)}`,
      title,
      date: parseTitleDate(title, fallbackDate, { trustYear: true }).date,
      bodyMd: blocksToMarkdown(body),
    });
  }
  return out;
}

// ---- Presentation child pages ----

export function findPresentationPages(blocks: NBlock[]): { id: string; title: string }[] {
  const out: { id: string; title: string }[] = [];
  const collect = (list: NBlock[]) => {
    for (const b of list) {
      if (b.type === 'child_page') out.push({ id: b.id, title: String((b.child_page as { title?: string })?.title ?? '') });
      if (b.children) collect(b.children);
    }
  };
  const walk = (list: NBlock[]) => {
    for (let i = 0; i < list.length; i++) {
      const b = list[i];
      if ((isHeading(b) || b.type === 'toggle') && /^\W*presentations?\b/i.test(blockPlainText(b).trim())) {
        if (b.children?.length) collect(b.children);
        else {
          // Plain heading: the child pages follow it as siblings.
          for (let j = i + 1; j < list.length && !isHeading(list[j]); j++) collect([list[j]]);
        }
      } else if (b.children) walk(b.children);
    }
  };
  walk(blocks);
  return out;
}
