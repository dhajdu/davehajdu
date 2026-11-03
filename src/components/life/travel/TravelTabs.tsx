import Link from 'next/link';

const TABS = [
  { key: 'current', label: 'Current', href: '/life/travel' },
  { key: 'upcoming', label: 'Upcoming', href: '/life/travel/upcoming' },
  { key: 'past', label: 'Past', href: '/life/travel/past' },
  { key: 'map', label: 'Map', href: '/life/travel/map' },
] as const;

export type TravelTab = (typeof TABS)[number]['key'];

const base = 'flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold -mb-px border-b-2';

// Current is live only while a trip is underway; at home it stays in place, dimmed.
export function TravelTabs({ active, hasCurrent }: { active: TravelTab; hasCurrent: boolean }) {
  return (
    <nav className="flex border-b border-border mb-5" aria-label="Travel views">
      {TABS.map((t) =>
        t.key === 'current' && !hasCurrent ? (
          <span key={t.key} aria-disabled="true" title="Not travelling today" className={`${base} border-transparent text-muted opacity-50`}>
            {t.label}
          </span>
        ) : (
          <Link
            key={t.key}
            href={t.href}
            aria-current={t.key === active ? 'page' : undefined}
            className={`${base} ${t.key === active ? 'border-blue text-navy' : 'border-transparent text-muted'}`}
          >
            {t.label}
          </Link>
        )
      )}
    </nav>
  );
}
