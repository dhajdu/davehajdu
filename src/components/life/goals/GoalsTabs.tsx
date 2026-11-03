import Link from 'next/link';

const TABS = [
  { key: 'goals', label: 'Goals', href: '/life/goals' },
  { key: 'record', label: 'Track record', href: '/life/goals/record' },
] as const;

export type GoalsTab = (typeof TABS)[number]['key'];

const base = 'flex-1 sm:flex-none text-center px-4 py-2.5 text-sm font-semibold -mb-px border-b-2';

// Two views: keep the goals current, and see how the months went.
export function GoalsTabs({ active }: { active: GoalsTab }) {
  return (
    <nav className="flex border-b border-border mb-5" aria-label="Goals views">
      {TABS.map((t) => (
        <Link key={t.key} href={t.href} aria-current={t.key === active ? 'page' : undefined} className={`${base} ${t.key === active ? 'border-blue text-navy' : 'border-transparent text-muted'}`}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
