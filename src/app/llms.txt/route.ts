import { POSTS } from '@/lib/posts-data';

// Serves /llms.txt — a curated, LLM-friendly map of the site for AI search
// engines (ChatGPT, Perplexity, Claude, Google AI). Follows the llmstxt.org
// spec. Generated from POSTS so the writing list stays in sync, mirroring
// sitemap.ts and robots.ts.

const BASE = 'https://www.davehajdu.com';

export const dynamic = 'force-static';

const CORE_PAGES: { path: string; title: string; desc: string }[] = [
  {
    path: '/ai-in-business',
    title: 'AI in Business — The Four Offices Framework',
    desc: 'A diagnostic lens mapping AI to Revenue, Talent, Operations, and Innovation. Why 95% of companies see no ROI from AI, and what actually moves the needle.',
  },
  {
    path: '/speaker-topics',
    title: 'Speaker Topics',
    desc: 'Signature AI keynotes and workshops for leaders — 2-hour, 4-hour, and full-day formats built on the Four Offices of the Future framework.',
  },
  {
    path: '/books',
    title: 'Books',
    desc: 'The Four Offices of the Future (a diagnostic lens for mapping AI to outcomes) and The Other 50% (leading when half the work is done by machines).',
  },
  {
    path: '/blog',
    title: 'Blog',
    desc: 'Letters to founders on AI, leadership, high-performance culture, and building in Vietnam.',
  },
];

const WORK_WITH_DAVE: { path: string; title: string; desc: string }[] = [
  {
    path: '/book-keynote',
    title: 'Book a Keynote',
    desc: 'Book Dave to speak at your event. $1,000–$4,000 based on duration and travel. EO chapter discounts available.',
  },
  {
    path: '/schedule-consultation',
    title: 'Schedule a Consultation',
    desc: '30–45 minute consultation to get clarity on where AI fits your business and what to do next.',
  },
];

function link(path: string, title: string, desc: string): string {
  return `- [${title}](${BASE}${path}): ${desc}`;
}

export function GET() {
  const sections: string[] = [
    '# Dave Hajdu',
    '',
    '> AI keynote speaker, consultant, and author. Where business fluency meets technical depth — the rare combination that makes AI actually work inside organizations. Creator of the Four Offices of the Future framework and The Other 50%, a philosophy of leading when half the work is human and half is AI.',
    '',
    "Dave Hajdu helps founders and executives lead in the 50/50 era. He co-instructs Georgetown University's \"Leadership in the AI Era\" program, teaches Entrepreneurs' Organization (EO) chapters across Asia and Australia, and writes regular letters to founders. Based in Vietnam; speaks and consults internationally.",
    '',
    '## Core Pages',
    '',
    ...CORE_PAGES.map((p) => link(p.path, p.title, p.desc)),
    '',
    '## Work With Dave',
    '',
    ...WORK_WITH_DAVE.map((p) => link(p.path, p.title, p.desc)),
    '',
    '## Writing',
    '',
    ...POSTS.map((post) => link(`/blog/${post.slug}`, post.title, post.excerpt)),
    '',
  ];

  return new Response(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
