// Post bodies are stored as markdown (posts.body_md) and rendered as blocks.
// One block per paragraph, separated by a blank line. Inline HTML is allowed.
//
//   ## Heading            h2 (### h3, #### h4)
//   > Quote               blockquote
//   - Item                li
//   <table>...</table>    table (raw HTML, one line)
//   ::figure /a.webp | Caption
//   ::gallery /a.webp /b.webp | Caption
//   ::screens /a.webp /b.webp | Caption
//   ::video /clip.mp4 /poster.webp | Caption
//   anything else         p

export type Block = { tag: string; text?: string; images?: string[]; caption?: string };

const MEDIA = new Set(['figure', 'gallery', 'screens', 'video']);
const PREFIX: Record<string, string> = { h2: '## ', h3: '### ', h4: '#### ', blockquote: '> ', li: '- ' };

export function parseBody(md: string): Block[] {
  return md
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Block => {
      const media = chunk.match(/^::(\w+)\s+(.*)$/);
      if (media && MEDIA.has(media[1])) {
        const [paths, caption] = media[2].split(/\s+\|\s+/, 2);
        const block: Block = { tag: media[1], images: paths.trim().split(/\s+/) };
        if (caption) block.caption = caption.trim();
        return block;
      }
      for (const [tag, prefix] of Object.entries(PREFIX)) {
        if (chunk.startsWith(prefix)) return { tag, text: chunk.slice(prefix.length) };
      }
      if (chunk.startsWith('<table')) return { tag: 'table', text: chunk };
      return { tag: 'p', text: chunk };
    });
}

export function toMarkdown(blocks: Block[]): string {
  return blocks
    .map((b) => {
      if (MEDIA.has(b.tag)) return `::${b.tag} ${(b.images ?? []).join(' ')}${b.caption ? ` | ${b.caption}` : ''}`;
      if (b.tag === 'table') return b.text ?? '';
      return (PREFIX[b.tag] ?? '') + (b.text ?? '');
    })
    .join('\n\n');
}
