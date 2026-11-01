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
