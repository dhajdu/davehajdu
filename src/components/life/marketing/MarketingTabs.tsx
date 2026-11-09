import Link from 'next/link';

const TABS = [
  { key: 'overview', label: 'Overview', href: '/life/marketing' },
  { key: 'calendar', label: 'Calendar', href: '/life/marketing/calendar' },
  { key: 'campaigns', label: 'Campaigns', href: '/life/marketing/campaigns' },
  { key: 'brand', label: 'Brand', href: '/life/marketing/brand' },
] as const;

export type MarketingTab = (typeof TABS)[number]['key'];

const base = 'flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold -mb-px border-b-2';

export function MarketingTabs({ active }: { active: MarketingTab }) {
  return (
    <nav className="flex border-b border-border mb-5" aria-label="Marketing views">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? 'page' : undefined} className={`${base} ${t.key === active ? 'border-blue text-navy' : 'border-transparent text-muted hover:text-navy'}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
