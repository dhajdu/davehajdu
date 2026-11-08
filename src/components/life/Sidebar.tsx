'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Inbox } from 'lucide-react';

type Item = { href: string; label: string };

// Inbox on top, then the groups. Areas are hidden until they hold something.
const SECTIONS: { label: string; items: Item[] }[] = [
  { label: 'Productivity', items: [{ href: '/life', label: 'Today' }, { href: '/life/journal', label: 'Journal' }, { href: '/life/travel', label: 'Travel' }, { href: '/life/memories', label: 'Memories' }, { href: '/life/goals', label: 'Goals' }, { href: '/life/review', label: 'Review' }] },
  { label: 'Health', items: [{ href: '/life/health', label: 'Fitness' }, { href: '/life/health/medical', label: 'Medical' }] },
  { label: 'EO', items: [{ href: '/life/eo', label: 'Forum' }, { href: '/life/eo/presentations', label: 'Presentations' }] },
  { label: 'Settings', items: [{ href: '/life/settings', label: 'Profile' }, { href: '/life/settings/accounts', label: 'Accounts' }, { href: '/life/settings/addresses', label: 'Addresses' }, { href: '/life/sources', label: 'Sources' }, { href: '/life/timeline', label: 'Timeline' }, { href: '/life/ask', label: 'Ask' }] },
];

// The mark: the ladder, with the one thing at the top of it.
function Mark() {
  return (
    <svg className="life-brand-mark" viewBox="0 0 32 32" width="32" height="32" aria-hidden>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M11.5 9.5v14M20.5 9.5v14" stroke="var(--life-navy)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11.5 15h9M11.5 20.5h9" stroke="var(--life-navy)" strokeWidth="2.2" strokeLinecap="round" opacity="0.4" />
      <circle cx="16" cy="9.5" r="2.7" fill="var(--life-navy)" />
    </svg>
  );
}

// Exact matches for pages that have their own child routes in another group.
const EXACT = new Set(['/life', '/life/health', '/life/eo', '/life/settings']);

export default function Sidebar({ pending }: { pending: number }) {
  const path = usePathname() ?? '';
  const is = (href: string) => {
    if (path === href) return true;
    if (EXACT.has(href)) return href === '/life/eo' && /^\/life\/eo\/[0-9a-f-]{36}$/.test(path);
    return path.startsWith(href + '/');
  };

  // The drawer is open only for the path it was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  const current = [{ href: '/life/inbox', label: 'Inbox' }, ...SECTIONS.flatMap((s) => s.items)].find((i) => is(i.href));

  return (
    <>
      <header className="life-mobilebar">
        <span className="life-mobilebar-title">{current?.label ?? '/life'}</span>
        <button type="button" onClick={() => setOpenOn(path)} aria-expanded={open}>Menu</button>
      </header>
      <div className={`life-scrim${open ? ' is-open' : ''}`} onClick={() => setOpenOn(null)} />

      <nav className={`life-sidebar${open ? ' is-open' : ''}`} aria-label="/life">
        <div className="life-brand-row">
          <Link href="/life" className="life-brand">
            <Mark />
            <span>
              <span className="life-brand-name block">/life</span>
              <span className="life-brand-sub block">Dave Hajdu</span>
            </span>
          </Link>
          <Link href="/life/inbox" className={`life-brand-inbox${is('/life/inbox') ? ' is-active' : ''}`} aria-label={pending > 0 ? `Inbox, ${pending} waiting` : 'Inbox'} title="Inbox">
            <Inbox size={18} strokeWidth={2.2} aria-hidden />
            {pending > 0 && <span className="life-nav-count">{pending}</span>}
          </Link>
        </div>

        <div className="life-nav">
          {SECTIONS.map((section) => (
            <div className="life-nav-group" key={section.label}>
              <div className="life-nav-label">{section.label}</div>
              {section.items.map((item) => (
                <Link key={item.href} href={item.href} className={`life-nav-link${is(item.href) ? ' is-active' : ''}`}>
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <form action="/life/logout" method="post" className="life-nav-foot">
          <button type="submit">Sign out</button>
        </form>
      </nav>
    </>
  );
}
