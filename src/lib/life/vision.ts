// The five-year vision as Dave wrote it in Notion: a statement, the core
// values, and the picture of life at the end of the horizon, in prose. One
// `entries` row (kind reference, this title) holds it as `fields`, with
// body_md rendered from them so search and Ask read it like any entry.
export const VISION_TITLE = 'Five-year vision';

export type VisionFields = { statement: string; values: string[]; picture: string };

export const EMPTY_VISION: VisionFields = { statement: '', values: [], picture: '' };

export function visionFields(stored: Partial<VisionFields> | null | undefined): VisionFields {
  return { ...EMPTY_VISION, ...(stored ?? {}), values: (stored?.values ?? []).filter(Boolean) };
}

export function renderVision(f: VisionFields): string {
  const lines: string[] = [];
  if (f.statement.trim()) lines.push(`### ${f.statement.trim()}`, '');
  if (f.values.length) {
    lines.push('### Core values', '');
    for (const v of f.values) lines.push(`- ${v.trim()}`);
    lines.push('');
  }
  if (f.picture.trim()) lines.push('### At the end of the five years, the picture of my life', '', f.picture.trim(), '');
  return lines.join('\n');
}
