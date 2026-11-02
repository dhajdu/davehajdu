import { createHash } from 'node:crypto';
import type { NBlock } from './client';
import { blockToMarkdown, isListType } from './markdown';

// A top-level block reduced to what template stripping needs.
export interface TopBlock {
  type: string;
  md: string;
  hash: string; // '' when the block has no content
}

// Normalised text used for hashing: formatting, checkbox state and spacing don't count.
export function normaliseMd(md: string): string {
  return md
    .toLowerCase()
    .replace(/\[x\]/g, '[ ]')
    .replace(/\]\([^)]*\)/g, ']')
    .replace(/[*_~`#>|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashText(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

export function toTopBlocks(blocks: NBlock[]): TopBlock[] {
  return blocks.map((b) => {
    const md = blockToMarkdown(b);
    const norm = normaliseMd(md);
    return { type: b.type, md, hash: norm && b.type !== 'divider' ? hashText(norm) : '' };
  });
}

export interface TemplateBlock {
  hash: string;
  md: string;
  pageIds: string[];
}

export interface StripResult {
  bodies: Map<string, string>;
  templates: Map<string, TemplateBlock>; // hashes counted as template in this batch
}

const HEADING = /^heading_[123]$/;

// Blocks whose hash appears on `threshold`+ distinct pages (or in `known`) are
// template: dropped from bodies and returned once each. A template heading is
// kept when it directly introduces the page's own content, so sections stay readable.
export function stripTemplates(
  pages: { id: string; blocks: TopBlock[] }[],
  opts: { threshold?: number; known?: Set<string> } = {}
): StripResult {
  const threshold = opts.threshold ?? 5;
  const seen = new Map<string, TemplateBlock>();
  for (const p of pages) {
    for (const b of p.blocks) {
      if (!b.hash) continue;
      const t = seen.get(b.hash) ?? { hash: b.hash, md: b.md, pageIds: [] };
      if (!t.pageIds.includes(p.id)) t.pageIds.push(p.id);
      seen.set(b.hash, t);
    }
  }
  const isTemplate = (h: string) => !!h && ((seen.get(h)?.pageIds.length ?? 0) >= threshold || !!opts.known?.has(h));

  const templates = new Map<string, TemplateBlock>();
  for (const [h, t] of seen) if (isTemplate(h)) templates.set(h, t);

  const bodies = new Map<string, string>();
  for (const p of pages) {
    const content = p.blocks.filter((b) => b.hash); // drop empty blocks and dividers
    const kept: TopBlock[] = [];
    content.forEach((b, i) => {
      if (!isTemplate(b.hash)) return void kept.push(b);
      if (HEADING.test(b.type) && !b.md.includes('\n')) {
        const next = content[i + 1];
        if (next && !isTemplate(next.hash) && !HEADING.test(next.type)) kept.push(b);
      }
    });
    let body = '';
    let prevList = false;
    for (const b of kept) {
      const list = isListType(b.type);
      if (body) body += list && prevList ? '\n' : '\n\n';
      body += b.md;
      prevList = list;
    }
    bodies.set(p.id, body);
  }
  return { bodies, templates };
}

const MD_HEADING = /^(#{1,3}) /;
const BOLD_LABEL = /^\*\*[^*]+\*\*:?\s*$/; // "**General Journal**" works like a sub-heading

// Journal pages copy the previous day's page forward, so most lines repeat with small edits.
// Pages go in date order; a line already seen on an earlier page is dropped, leaving only
// what was new that day. Headings stay only when something new sits under them.
export function dropCopiedLines(pages: { id: string; body: string }[]): Map<string, string> {
  const seen = new Set<string>();
  const out = new Map<string, string>();
  for (const p of pages) {
    const kept: string[] = [];
    let pending: { level: number; line: string }[] = [];
    const fresh: string[] = [];
    for (const line of p.body.split('\n')) {
      const norm = normaliseMd(line);
      const h = MD_HEADING.exec(line);
      if (h || BOLD_LABEL.test(line.trim())) {
        const level = h ? h[1].length : 4;
        pending = pending.filter((x) => x.level < level);
        pending.push({ level, line });
      } else if (!norm) {
        if (kept.length && kept[kept.length - 1] !== '') kept.push('');
      } else if (!seen.has(norm)) {
        for (const x of pending) {
          if (kept.length && kept[kept.length - 1] !== '') kept.push('');
          kept.push(x.line, '');
        }
        pending = [];
        kept.push(line);
      }
      if (norm) fresh.push(norm);
    }
    for (const n of fresh) seen.add(n);
    out.set(p.id, kept.join('\n').replace(/\n{3,}/g, '\n\n').trim());
  }
  return out;
}
