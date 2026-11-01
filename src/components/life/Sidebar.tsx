'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const MORE_AREAS = ['people', 'money', 'work', 'time', 'direction', 'admin', 'legacy'];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function NavLink({ href, children, active }: { href: string; children: React.ReactNode; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
        active ? 'bg-light-gray text-navy font-semibold' : 'text-body-text hover:bg-light-gray'
      }`}
    >
      {children}
    </Link>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="px-3 pt-4 pb-1 text-xs font-semibold text-muted">{children}</div>;
}

function Nav({ pending }: { pending: number }) {
  const path = usePathname() ?? '';
  const is = (href: string) => (href === '/life' ? path === '/life' : path === href || path.startsWith(href + '/'));
  const moreActive = MORE_AREAS.some((a) => is(`/life/area/${a}`));

  return (
    <nav className="flex flex-col gap-0.5">
      <NavLink href="/life" active={is('/life')}>This month</NavLink>
      <NavLink href="/life/review" active={is('/life/review')}>Review</NavLink>
      <NavLink href="/life/timeline" active={is('/life/timeline')}>Timeline</NavLink>

      <Group>Areas</Group>
      <NavLink href="/life/area/body" active={is('/life/area/body')}>Body</NavLink>
      <NavLink href="/life/area/mind" active={is('/life/area/mind')}>Mind</NavLink>
      <NavLink href="/life/travel" active={is('/life/travel')}>Places</NavLink>
      <details open={moreActive} className="group">
        <summary className="cursor-pointer list-none rounded-lg px-3 py-1.5 text-sm text-body-text hover:bg-light-gray">
          More <span className="text-muted group-open:hidden">+</span><span className="text-muted hidden group-open:inline">−</span>
        </summary>
        <div className="flex flex-col gap-0.5 pl-3">
          {MORE_AREAS.map((a) => (
            <NavLink key={a} href={`/life/area/${a}`} active={is(`/life/area/${a}`)}>{cap(a)}</NavLink>
          ))}
        </div>
      </details>

      <Group>System</Group>
      <NavLink href="/life/inbox" active={is('/life/inbox')}>
        Inbox
        {pending > 0 && <span className="text-xs font-semibold bg-magenta text-white rounded-full px-2">{pending}</span>}
      </NavLink>
      <NavLink href="/life/sources" active={is('/life/sources')}>Sources</NavLink>
      <NavLink href="/life/ask" active={is('/life/ask')}>Ask</NavLink>

      <form action="/life/logout" method="post" className="mt-4">
        <button type="submit" className="w-full text-left rounded-lg px-3 py-1.5 text-sm text-muted hover:bg-light-gray">
          Sign out
        </button>
      </form>
    </nav>
  );
}

export default function Sidebar({ pending }: { pending: number }) {
  // Menu is open only for the path it was opened on, so navigating closes it.
  const path = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === path;

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-20 bg-white border-b border-border">
        <div className="flex items-center justify-between px-4 h-12">
          <Link href="/life" className="font-bold text-navy">/life</Link>
          <button
            type="button"
            onClick={() => setOpenOn(open ? null : path)}
            aria-expanded={open}
            className="text-sm font-semibold text-navy border-[1.5px] border-navy rounded-lg px-3 py-1"
          >
            {open ? 'Close' : 'Menu'}
            {!open && pending > 0 && <span className="ml-1.5 text-xs bg-magenta text-white rounded-full px-1.5">{pending}</span>}
          </button>
        </div>
        {open && (
          <div className="px-2 pb-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
            <Nav pending={pending} />
          </div>
        )}
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 border-r border-border px-2 py-5 sticky top-0 h-screen overflow-y-auto">
        <Link href="/life" className="block px-3 mb-4 text-lg font-bold text-navy">/life</Link>
        <Nav pending={pending} />
      </aside>
    </>
  );
}
