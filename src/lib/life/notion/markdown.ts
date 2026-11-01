import type { NBlock, RichText } from './client';

// Notion rich text → inline markdown. Mentions render as their text.
export function richTextToMd(rt: RichText[] | undefined): string {
  return (rt ?? [])
    .map((t) => {
      let s = t.plain_text ?? '';
      if (!s) return '';
      const a = t.annotations ?? {};
      if (a.code) s = `\`${s}\``;
      else {
        if (a.bold) s = `**${s}**`;
        if (a.italic) s = `_${s}_`;
        if (a.strikethrough) s = `~~${s}~~`;
      }
      if (t.href && t.type !== 'mention') s = `[${s}](${t.href})`;
      return s;
    })
    .join('');
}

function data(b: NBlock): Record<string, unknown> {
  return (b[b.type] as Record<string, unknown>) ?? {};
}

export function blockText(b: NBlock): string {
  const d = data(b);
  return richTextToMd(d.rich_text as RichText[] | undefined);
}

export function blockPlainText(b: NBlock): string {
  const d = data(b);
  return ((d.rich_text as RichText[] | undefined) ?? []).map((t) => t.plain_text).join('');
}

const LIST_TYPES = new Set(['bulleted_list_item', 'numbered_list_item', 'to_do', 'toggle']);

function indent(s: string, pad: string): string {
  return s
    .split('\n')
    .map((l) => (l ? pad + l : l))
    .join('\n');
}

function childrenMd(b: NBlock, pad = '  '): string {
  if (!b.children?.length) return '';
  const md = blocksToMarkdown(b.children);
  return md ? '\n' + indent(md, pad) : '';
}

// One block (with its children) → markdown.
export function blockToMarkdown(b: NBlock): string {
  const d = data(b);
  const text = blockText(b);
  switch (b.type) {
    case 'paragraph':
      return text + (b.children?.length ? childrenMd(b) : '');
    case 'heading_1':
    case 'heading_2':
    case 'heading_3': {
      const level = Number(b.type.slice(-1));
      const head = `${'#'.repeat(level)} ${text}`;
      return b.children?.length ? `${head}\n\n${blocksToMarkdown(b.children)}` : head;
    }
    case 'bulleted_list_item':
    case 'toggle':
      return `- ${text}${childrenMd(b)}`;
    case 'numbered_list_item':
      return `1. ${text}${childrenMd(b, '   ')}`;
    case 'to_do':
      return `- [${d.checked ? 'x' : ' '}] ${text}${childrenMd(b)}`;
    case 'quote':
      return indent(text + (b.children?.length ? '\n' + blocksToMarkdown(b.children) : ''), '> ').replace(/^$/gm, '>');
    case 'callout': {
      const icon = (d.icon as { emoji?: string } | undefined)?.emoji;
      const body = (icon ? `${icon} ` : '') + text + (b.children?.length ? '\n\n' + blocksToMarkdown(b.children) : '');
      return indent(body, '> ').replace(/^$/gm, '>');
    }
    case 'code':
      return '```' + String(d.language ?? '') + '\n' + ((d.rich_text as RichText[]) ?? []).map((t) => t.plain_text).join('') + '\n```';
    case 'equation':
      return `$$${String(d.expression ?? '')}$$`;
    case 'divider':
      return '---';
    case 'column_list':
    case 'column':
    case 'synced_block':
    case 'template':
      return b.children?.length ? blocksToMarkdown(b.children) : '';
    case 'child_page':
      return `[[${String(d.title ?? 'Untitled')}]]`;
    case 'child_database':
      return `[[Database: ${String(d.title ?? 'Untitled')}]]`;
    case 'link_to_page':
      return '[[Linked page]]';
    case 'bookmark':
    case 'embed':
    case 'link_preview': {
      const url = String(d.url ?? '');
      const cap = richTextToMd(d.caption as RichText[] | undefined);
      return url ? `[${cap || url}](${url})` : '';
    }
    case 'image':
    case 'video':
    case 'file':
    case 'pdf':
    case 'audio': {
      const cap = richTextToMd(d.caption as RichText[] | undefined);
      return `[${b.type}${cap ? `: ${cap}` : ''}]`;
    }
    case 'table': {
      const rows = (b.children ?? []).filter((r) => r.type === 'table_row');
      if (!rows.length) return '';
      const cells = rows.map((r) =>
        (((r.table_row as { cells?: RichText[][] })?.cells ?? []).map((c) => richTextToMd(c).replace(/\|/g, '\\|')))
      );
      const width = Math.max(...cells.map((c) => c.length));
      const line = (c: string[]) => `| ${Array.from({ length: width }, (_, i) => c[i] ?? '').join(' | ')} |`;
      return [line(cells[0]), `|${' --- |'.repeat(width)}`, ...cells.slice(1).map(line)].join('\n');
    }
    default:
      return text;
  }
}

// Block list → markdown. Consecutive list items join with single newlines.
export function blocksToMarkdown(blocks: NBlock[]): string {
  let out = '';
  let prevList = false;
  for (const b of blocks) {
    const md = blockToMarkdown(b);
    if (!md.trim()) continue;
    const isList = LIST_TYPES.has(b.type);
    if (out) out += isList && prevList ? '\n' : '\n\n';
    out += md;
    prevList = isList;
  }
  return out;
}

export function isListType(type: string) {
  return LIST_TYPES.has(type);
}
