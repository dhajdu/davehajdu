import Link from 'next/link';

const TABS = [
  { key: 'upcoming', label: 'Upcoming', href: '/life/travel' },
  { key: 'past', label: 'Past', href: '/life/travel/past' },
  { key: 'map', label: 'Map', href: '/life/travel/map' },
] as const;

export function TravelTabs({ active }: { active: (typeof TABS)[number]['key'] }) {
  return (
    <nav className="flex border-b border-border mb-5" aria-label="Travel views">
      {TABS.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={t.key === active ? 'page' : undefined}
          className={`flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold -mb-px border-b-2 ${
            t.key === active ? 'border-blue text-navy' : 'border-transparent text-muted'
          }`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
