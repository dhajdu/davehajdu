'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const MORE_AREAS = ['people', 'money', 'work', 'time', 'direction', 'admin', 'legacy'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

type Item = { href: string; label: string };

const SECTIONS: { label?: string; items: Item[] }[] = [
  { items: [{ href: '/life', label: 'This month' }, { href: '/life/review', label: 'Review' }, { href: '/life/timeline', label: 'Timeline' }] },
  { label: 'Areas', items: [{ href: '/life/area/body', label: 'Body' }, { href: '/life/area/mind', label: 'Mind' }, { href: '/life/travel', label: 'Places' }] },
  { label: 'More areas', items: MORE_AREAS.map((a) => ({ href: `/life/area/${a}`, label: cap(a) })) },
  { label: 'System', items: [{ href: '/life/inbox', label: 'Inbox' }, { href: '/life/sources', label: 'Sources' }, { href: '/life/ask', label: 'Ask' }] },
];

export default function Sidebar({ pending }: { pending: number }) {
  const path = usePathname() ?? '';
  const is = (href: string) => (href === '/life' ? path === '/life' : path === href || path.startsWith(href + '/'));

  // The drawer is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;
  const [moreOpen, setMoreOpen] = useState<boolean | null>(null);
  const moreShown = moreOpen ?? MORE_AREAS.some((a) => is(`/life/area/${a}`));

  const current = SECTIONS.flatMap((s) => s.items).find((i) => is(i.href));

  return (
    <>
      <header className="life-mobilebar">
        <span className="life-mobilebar-title">{current?.label ?? '/life'}</span>
        <button type="button" onClick={() => setOpenOn(path)} aria-expanded={open}>Menu</button>
      </header>
      <div className={`life-scrim${open ? ' is-open' : ''}`} onClick={() => setOpenOn(null)} />

      <nav className={`life-sidebar${open ? ' is-open' : ''}`} aria-label="/life">
        <Link href="/life" className="life-brand">
          <span className="life-brand-mark">L</span>
          <span>
            <span className="life-brand-name block">/life</span>
            <span className="life-brand-sub block">Dave Hajdu</span>
          </span>
        </Link>

        <div className="life-nav">
          {SECTIONS.map((section, si) => {
            const collapsible = section.label === 'More areas';
            const shown = !collapsible || moreShown;
            return (
              <div className="life-nav-group" key={section.label ?? si}>
                {section.label &&
                  (collapsible ? (
                    <button type="button" className="life-nav-label" aria-expanded={shown} onClick={() => setMoreOpen(!shown)}>
                      {section.label}
                      <span aria-hidden>{shown ? '▾' : '▸'}</span>
                    </button>
                  ) : (
                    <div className="life-nav-label">{section.label}</div>
                  ))}
                {shown &&
                  section.items.map((item) => (
                    <Link key={item.href} href={item.href} className={`life-nav-link${is(item.href) ? ' is-active' : ''}`}>
                      {item.label}
                      {item.href === '/life/inbox' && pending > 0 && <span className="life-nav-count">{pending}</span>}
                    </Link>
                  ))}
              </div>
            );
          })}
        </div>

        <form action="/life/logout" method="post" className="life-nav-foot">
          <button type="submit">Sign out</button>
        </form>
      </nav>
    </>
  );
}
